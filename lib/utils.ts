import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// This check can be removed, it is just for tutorial purposes
export const hasEnvVars =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function resolvePath(obj: any, path: string): any {
    if (!obj || !path) return undefined;
    return path.split('.').reduce((prev, curr) => {
        if (!prev) return undefined;
        if (prev[curr] !== undefined) return prev[curr];
        const currLower = curr.toLowerCase();
        const match = Object.keys(prev).find(k => k.toLowerCase() === currLower);
        return match !== undefined ? prev[match] : undefined;
    }, obj);
}

export function resolveMappedValue(template: any, sourceData: any, triggeringValue?: any, extraData?: any): any {
    if (template === undefined || template === null) return '';
    if (typeof template === 'string') {
        const trimmed = template.trim();
        
        // Single perfect token matches (to preserve exact types like objects/booleans/numbers):
        if (trimmed.startsWith('{{$response.') && trimmed.endsWith('}}') && !trimmed.substring(12, trimmed.length - 2).includes('{{')) {
            const path = trimmed.slice(12, -2).trim();
            return resolvePath(sourceData, path);
        }
        if (trimmed.startsWith('$response.')) {
            return resolvePath(sourceData, trimmed.replace('$response.', ''));
        }
        if (trimmed.startsWith('{{$value.') && trimmed.endsWith('}}') && !trimmed.substring(9, trimmed.length - 2).includes('{{')) {
            const path = trimmed.slice(9, -2).trim();
            return resolvePath(extraData, path) ?? resolvePath(triggeringValue, path);
        }
        if (trimmed.startsWith('$value.')) {
            const path = trimmed.replace('$value.', '');
            return resolvePath(extraData, path) ?? resolvePath(triggeringValue, path);
        }
        if (trimmed === '{{$value}}' || trimmed === '$value') {
            return triggeringValue !== undefined ? triggeringValue : '';
        }

        // Multiple tokens inside a string (e.g. "Name: {{$response.first}} {{$response.last}}")
        if (trimmed.includes('{{')) {
            let resultStr = trimmed;
            const regex = /\{\{\$(response|value)\.([^}]+)\}\}/g;
            resultStr = resultStr.replace(regex, (fullMatch, type, path) => {
                let resolved;
                if (type === 'response') {
                    resolved = resolvePath(sourceData, path.trim());
                } else {
                    resolved = resolvePath(extraData, path.trim()) ?? resolvePath(triggeringValue, path.trim());
                }
                return resolved !== undefined ? String(resolved) : '';
            });
            resultStr = resultStr.replace(/\{\{\s*\$value\s*\}\}/g, triggeringValue !== undefined ? String(triggeringValue) : '');
            return resultStr;
        }

        // If it's a flat key match (Style B):
        const pathResolved = resolvePath(sourceData, trimmed);
        if (pathResolved !== undefined) return pathResolved;
    }
    return template;
}

export function applyMappingConfig(mappingConfig: Record<string, any>, sourceData: any, triggeringValue?: any, extraData?: any): Record<string, any> {
    const updates: Record<string, any> = {};
    if (!mappingConfig) return updates;
    for (const [key, val] of Object.entries(mappingConfig)) {
        const isStyleA = typeof val === 'string' && (val.includes('{{$') || val.startsWith('$') || val === '$value');
        if (isStyleA) {
            const resolved = resolveMappedValue(val, sourceData, triggeringValue, extraData);
            if (resolved !== undefined) updates[key] = resolved;
        } else {
            const resolved = resolveMappedValue(key, sourceData, triggeringValue, extraData);
            if (resolved !== undefined) updates[String(val)] = resolved;
        }
    }
    return updates;
}
