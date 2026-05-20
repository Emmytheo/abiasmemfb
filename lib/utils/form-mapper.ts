/**
 * form-mapper.ts — Unified Data Mapper Engine
 *
 * Handles resolving values from API response objects and trigger values
 * using both Style A (mustache token: {{$response.path.to.field}}) and
 * Style B (flat dot-path key: "Payload.accountName") mapping notations.
 *
 * All object property lookups are case-insensitive to handle BankOne/Qore
 * API responses that use mixed casing (PascalCase, camelCase, etc.).
 */

/**
 * Safely traverses a nested object using a dot-separated path string.
 * Comparison is case-insensitive at each level.
 *
 * @example resolvePath({ Payload: { AccountName: "John" } }, "payload.accountname") → "John"
 */
export function resolvePath(obj: any, path: string): any {
    if (!obj || !path) return undefined;
    return path.split('.').reduce((prev, curr) => {
        if (prev == null) return undefined;
        // Exact match first (fastest)
        if (prev[curr] !== undefined) return prev[curr];
        // Case-insensitive fallback
        const currLower = curr.toLowerCase();
        const key = Object.keys(prev).find(k => k.toLowerCase() === currLower);
        return key !== undefined ? prev[key] : undefined;
    }, obj);
}

/**
 * Resolves a single mapping template string against available data sources.
 *
 * Supported template patterns:
 *  - `{{$response.some.nested.path}}` → value from API response
 *  - `{{$value.some.prop}}`           → value from the triggering extra object (e.g. beneficiary)
 *  - `{{$value}}`                     → the raw triggering value itself
 *  - `$response.some.path`            → shorthand (no braces) for response path
 *  - `$value`                         → shorthand for the raw triggering value
 *  - Any other string                 → returned as a static literal value
 *
 * @param template     - The mapping template string from mappingConfig
 * @param responseData - The API response payload (or null)
 * @param triggerValue - The raw value that triggered the event
 * @param extraData    - An optional object (e.g. selected beneficiary row)
 */
export function resolveMappedValue(
    template: any,
    responseData: any,
    triggerValue: any,
    extraData?: any
): any {
    if (typeof template !== 'string') return template;

    const t = template.trim();

    // --- Style A: Mustache token patterns ---
    if (t.startsWith('{{') && t.endsWith('}}')) {
        const inner = t.slice(2, -2).trim();

        if (inner.startsWith('$response.')) {
            return resolvePath(responseData, inner.slice('$response.'.length));
        }
        if (inner.startsWith('$value.')) {
            return resolvePath(extraData ?? triggerValue, inner.slice('$value.'.length));
        }
        if (inner === '$value') {
            return triggerValue;
        }
        // Unknown token — return as-is
        return template;
    }

    // --- Style B: Shorthand path notations ---
    if (t.startsWith('$response.')) {
        return resolvePath(responseData, t.slice('$response.'.length));
    }
    if (t.startsWith('$value.')) {
        return resolvePath(extraData ?? triggerValue, t.slice('$value.'.length));
    }
    if (t === '$value') {
        return triggerValue;
    }

    // --- Style B fallback: dot-path key from response (legacy BankOne style) ---
    // e.g. "Payload.accountName" or "accountName"
    if (responseData && t.includes('.')) {
        const resolved = resolvePath(responseData, t);
        if (resolved !== undefined) return resolved;
    }
    if (responseData && typeof responseData === 'object') {
        const resolved = resolvePath(responseData, t);
        if (resolved !== undefined) return resolved;
    }

    // Fallback: static literal
    return template;
}

/**
 * Applies a full mappingConfig object, returning a flat key→value record
 * of resolved form field updates.
 *
 * mappingConfig can be in one of two shapes:
 *  - Shape A (API response mapping): { "api.path.or.template": "formFieldId" }
 *  - Shape B (value mapping):        { "formFieldId": "template" }
 *
 * The function auto-detects the shape based on convention: if the config values
 * look like field IDs (no special chars), it assumes Shape A; otherwise Shape B.
 *
 * @param mappingConfig - The event.mappingConfig object
 * @param responseData  - The API response payload
 * @param triggerValue  - The raw value that triggered the event
 * @param extraData     - Optional extra object (e.g. selected row)
 * @returns             - Record<formFieldId, resolvedValue> to merge into formData
 */
export function applyMappingConfig(
    mappingConfig: Record<string, any>,
    responseData: any,
    triggerValue: any,
    extraData?: any
): Record<string, any> {
    const updates: Record<string, any> = {};

    for (const [key, value] of Object.entries(mappingConfig)) {
        // Shape A: key = api path/template, value = form field id
        // Shape B: key = form field id, value = template
        // Heuristic: if value is a plain string with no special chars, treat as Shape A (key=template, value=formKey)
        // If value contains tokens or dots, treat as Shape B (key=formKey, value=template)
        const isShapeB =
            typeof value === 'string' &&
            (value.includes('{{') || value.startsWith('$') || value.includes('.') || value === '');

        if (isShapeB) {
            // Shape B: key is form field id, value is the template to resolve
            const resolved = resolveMappedValue(value, responseData, triggerValue, extraData);
            if (resolved !== undefined) updates[key] = resolved;
        } else {
            // Shape A: key is the source path/template, value is the target form field id
            const resolved = resolveMappedValue(key, responseData, triggerValue, extraData);
            if (resolved !== undefined) updates[String(value)] = resolved;
        }
    }

    return updates;
}

/**
 * Normalises API options arrays from an endpoint response into a uniform
 * { label, value } format using configurable keys.
 *
 * @param rawData      - The raw API response (array or object with nested array)
 * @param textKey      - Key to use as the human-readable label
 * @param valueKey     - Key to use as the machine value
 */
export function normalizeOptionsData(
    rawData: any,
    textKey: string = 'name',
    valueKey: string = 'id'
): { label: string; value: any }[] {
    let arr: any[] = [];

    if (Array.isArray(rawData)) {
        arr = rawData;
    } else if (rawData && typeof rawData === 'object') {
        // Try to find a nested array (e.g. { data: [...] } or { Payload: [...] })
        const candidate = rawData.data ?? rawData.Payload ?? rawData.payload ?? rawData.items ?? rawData.results;
        if (Array.isArray(candidate)) {
            arr = candidate;
        } else {
            // Treat the object as a key-value map
            return Object.entries(rawData).map(([k, v]) => ({ label: String(v), value: k }));
        }
    }

    return arr.map(item => {
        if (typeof item === 'object' && item !== null) {
            const label = resolvePath(item, textKey) ?? resolvePath(item, 'name') ?? resolvePath(item, 'label') ?? String(Object.values(item)[0] ?? '');
            const value = resolvePath(item, valueKey) ?? resolvePath(item, 'id') ?? resolvePath(item, 'value') ?? label;
            return { label: String(label), value };
        }
        return { label: String(item), value: item };
    });
}
