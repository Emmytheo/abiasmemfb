import { useState, useCallback } from 'react';
import { toast } from 'sonner';

interface FormSchemaField {
    name: string;
    validations?: any[];
    events?: any[];
    [key: string]: any;
}

interface DynamicFormContext {
    values: Record<string, any>;
    setFieldValue: (name: string, value: any) => void;
    schema: FormSchemaField[];
}

export function useDynamicFormEvents(context: DynamicFormContext) {
    const { values, setFieldValue, schema } = context;
    const [loadingEvents, setLoadingEvents] = useState<Record<string, boolean>>({});
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const handleEvent = useCallback(async (fieldName: string, trigger: 'onChange' | 'onBlur' | 'onLoad', newValue?: any) => {
        const fieldSchema = schema.find(f => f.name === fieldName);
        if (!fieldSchema || !fieldSchema.events) return;

        const triggeredEvents = fieldSchema.events.filter(e => e.trigger === trigger);
        if (triggeredEvents.length === 0) return;

        // Current snapshot + newly changed value
        const currentContext = { ...values, [fieldName]: newValue !== undefined ? newValue : values[fieldName] };

        // Process sequentially
        for (const event of triggeredEvents) {
            try {
                if (event.action === 'SET_VALUE' && event.mappingConfig) {
                    Object.entries(event.mappingConfig).forEach(([targetField, staticVal]) => {
                        setFieldValue(targetField, staticVal);
                    });
                }
                
                if (event.action === 'EXECUTE_ENDPOINT' && event.endpointId) {
                    setLoadingEvents(prev => ({ ...prev, [fieldName]: true }));
                    
                    const endpointId = typeof event.endpointId === 'object' ? event.endpointId.id : event.endpointId;

                    // Hit our secure /execute proxy to run the endpoint via the vault
                    const res = await fetch('/api/endpoints/execute', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            endpointId,
                            dynamicPayload: currentContext
                        })
                    });
                    
                    if (res.ok) {
                        const data = await res.json();
                        // Handle auto-mapping of response to form fields
                        if (event.mappingConfig) {
                            Object.entries(event.mappingConfig).forEach(([targetField, sourcePath]) => {
                                // Super simplistic dot-notation extraction:
                                const val = String(sourcePath).split('.').reduce((acc, part) => acc && acc[part], data);
                                if (val !== undefined) setFieldValue(targetField, val);
                            });
                        }
                    } else {
                        throw new Error('Endpoint execution failed');
                    }
                }
            } catch (err: any) {
                console.error(`Error executing event for ${fieldName}:`, err);
                toast.error(`Auto-fill failed: ${err.message}`);
            } finally {
                setLoadingEvents(prev => ({ ...prev, [fieldName]: false }));
            }
        }
    }, [schema, values, setFieldValue]);

    const runValidations = useCallback((fieldName: string, value: any) => {
        const fieldSchema = schema.find(f => f.name === fieldName);
        let error = '';

        if (fieldSchema?.validations) {
            for (const rule of fieldSchema.validations) {
                if (rule.type === 'regex' && rule.value) {
                    const regex = new RegExp(rule.value);
                    if (!regex.test(String(value))) {
                        error = rule.errorMessage || 'Invalid format';
                        break;
                    }
                }
                if (rule.type === 'min' && Number(value) < Number(rule.value)) {
                    error = rule.errorMessage || `Minimum required is ${rule.value}`;
                    break;
                }
                if (rule.type === 'max' && Number(value) > Number(rule.value)) {
                    error = rule.errorMessage || `Maximum allowed is ${rule.value}`;
                    break;
                }
            }
        }
        
        setFieldErrors(prev => ({
            ...prev,
            [fieldName]: error
        }));

        return !error;
    }, [schema]);

    const handleChange = useCallback((fieldName: string, value: any) => {
        setFieldValue(fieldName, value);
        runValidations(fieldName, value);
        handleEvent(fieldName, 'onChange', value);
    }, [handleEvent, runValidations, setFieldValue]);

    const handleBlur = useCallback((fieldName: string) => {
        handleEvent(fieldName, 'onBlur');
    }, [handleEvent]);

    const validateAll = useCallback(() => {
        let isValid = true;
        schema.forEach(field => {
            const pass = runValidations(field.name, values[field.name]);
            if (!pass) isValid = false;
        });
        return isValid;
    }, [schema, values, runValidations]);

    return {
        handleChange,
        handleBlur,
        validateAll,
        loadingEvents,
        fieldErrors
    };
}
