'use client'

import React, { useState } from 'react'
import { 
    GripVertical, Trash, Plus, Settings2, ShieldAlert, Zap, 
    ChevronDown, Info 
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { FormField, FieldValidation, FieldEvent } from '@/lib/api/types'

interface FormFieldBuilderProps {
    fields: any[]
    endpoints: any[]
    onChange: (fields: any[]) => void
    idKey?: 'id' | 'name' // Products use 'id', Services use 'name' as key
}

export function FormFieldBuilder({ fields, endpoints, onChange, idKey = 'id' }: FormFieldBuilderProps) {
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

    const addField = () => {
        const newField: any = {
            [idKey]: `field_${Math.random().toString(36).substr(2, 9)}`,
            label: 'New Field',
            type: 'text',
            required: false,
            validations: [],
            events: []
        }
        onChange([...fields, newField])
    }

    const updateField = (index: number, updates: any) => {
        const newFields = [...fields]
        newFields[index] = { ...newFields[index], ...updates }
        onChange(newFields)
    }

    const removeField = (index: number) => {
        onChange(fields.filter((_, i) => i !== index))
    }

    // Drag and Drop
    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDraggedIndex(index)
        e.dataTransfer.effectAllowed = 'move'
    }

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault()
        if (draggedIndex === null || draggedIndex === index) return
        const newFields = [...fields]
        const draggedItem = newFields[draggedIndex]
        newFields.splice(draggedIndex, 1)
        newFields.splice(index, 0, draggedItem)
        onChange(newFields)
        setDraggedIndex(index)
    }

    return (
        <div className="space-y-4">
            {fields.map((field, index) => (
                <div
                    key={field[idKey] || index}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={() => setDraggedIndex(null)}
                    className={`relative bg-card border rounded-xl p-3 md:p-4 flex flex-col sm:flex-row gap-4 transition-all ${draggedIndex === index ? 'opacity-40 border-primary border-dashed' : 'hover:border-primary/50 shadow-sm hover:shadow-md'}`}
                >
                    <div className="hidden sm:flex cursor-grab active:cursor-grabbing text-muted-foreground mt-2 flex-col justify-center pb-8" title="Drag to reorder">
                        <GripVertical className="h-5 w-5" />
                    </div>
                    {/* Mobile Drag Handle */}
                    <div className="sm:hidden absolute top-2 right-12 text-muted-foreground p-2">
                        <GripVertical className="h-4 w-4" />
                    </div>

                    <div className="flex-1 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Field Label</label>
                                <input
                                    type="text"
                                    value={field.label || ''}
                                    onChange={(e) => updateField(index, { label: e.target.value })}
                                    className="w-full bg-background border rounded text-sm h-9 px-3 outline-none focus:border-primary"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Input Type</label>
                                <select
                                    value={field.type || 'text'}
                                    onChange={(e) => updateField(index, { type: e.target.value })}
                                    className="w-full bg-background border rounded text-sm h-9 px-3 outline-none focus:border-primary"
                                >
                                    <option value="text">Short Text</option>
                                    <option value="number">Number</option>
                                    <option value="email">Email</option>
                                    <option value="select">Dropdown Select</option>
                                    <option value="file">File Upload</option>
                                    <option value="destination_bank_lookup">Bank Lookup</option>
                                </select>
                            </div>

                            {/* Variable Name (For Services) */}
                            {idKey === 'name' && (
                                <div className="space-y-1 md:col-span-2">
                                    <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Variable Name (Mapping Code)</label>
                                    <input
                                        type="text"
                                        value={field.name || ''}
                                        onChange={(e) => updateField(index, { name: e.target.value.replace(/\s+/g, '_').toLowerCase() })}
                                        placeholder="e.g. account_number"
                                        className="w-full bg-background border rounded font-mono text-xs h-9 px-3 outline-none focus:border-primary"
                                    />
                                </div>
                            )}

                            {field.type === 'select' && (
                                <div className="space-y-1 md:col-span-2">
                                    <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Options (comma separated)</label>
                                    <input
                                        type="text"
                                        value={Array.isArray(field.options) ? field.options.join(', ') : field.options || ''}
                                        onChange={(e) => updateField(index, { options: idKey === 'id' ? e.target.value.split(',').map(s => s.trim()) : e.target.value })}
                                        placeholder="Option A, Option B, Option C"
                                        className="w-full bg-background border rounded text-sm h-9 px-3 outline-none focus:border-primary"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Advanced Settings */}
                        <div className="border-t pt-2">
                            <Accordion type="single" collapsible className="w-full">
                                <AccordionItem value="advanced" className="border-none">
                                    <AccordionTrigger className="py-2 hover:no-underline text-muted-foreground hover:text-primary transition-colors">
                                        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest">
                                            <Settings2 className="h-3.5 w-3.5" /> Logical Validations & Events
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="pt-4 pb-0">
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                            {/* Validations */}
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <h5 className="text-[11px] font-black uppercase text-primary tracking-tighter flex items-center gap-1.5">
                                                        <ShieldAlert size={12} /> Validations
                                                    </h5>
                                                    <Button variant="ghost" size="sm" onClick={() => {
                                                        const v = [...(field.validations || [])]
                                                        v.push({ type: 'regex', value: '', errorMessage: '' })
                                                        updateField(index, { validations: v })
                                                    }} className="h-6 text-[10px] px-2 bg-primary/5">
                                                        + ADD RULE
                                                    </Button>
                                                </div>
                                                <div className="space-y-2">
                                                    {(field.validations || []).map((v: any, vIdx: number) => (
                                                        <div key={vIdx} className="bg-muted p-2 rounded-lg space-y-2 border border-primary/10">
                                                            <div className="flex gap-2">
                                                                <select 
                                                                    value={v.type} 
                                                                    onChange={(e) => {
                                                                        const vCopy = [...field.validations]; vCopy[vIdx].type = e.target.value;
                                                                        updateField(index, { validations: vCopy })
                                                                    }}
                                                                    className="flex-1 bg-background border rounded h-7 text-[10px] px-1 outline-none"
                                                                >
                                                                    <option value="regex">Pattern (Regex)</option>
                                                                    <option value="min">Min Value</option>
                                                                    <option value="max">Max Value</option>
                                                                    <option value="api_lookup">API Verify</option>
                                                                </select>
                                                                <button onClick={() => {
                                                                    updateField(index, { validations: field.validations.filter((_: any, i: number) => i !== vIdx) })
                                                                }} className="text-destructive p-1 hover:bg-destructive/10 rounded transition-colors"><Trash size={12} /></button>
                                                            </div>
                                                            <div className="flex flex-col gap-1.5">
                                                                <input 
                                                                    type="text" 
                                                                    placeholder="Limit / Regex / Endpoint"
                                                                    value={v.value || ''}
                                                                    onChange={(e) => {
                                                                        const vCopy = [...field.validations]; vCopy[vIdx].value = e.target.value;
                                                                        updateField(index, { validations: vCopy })
                                                                    }}
                                                                    className="bg-background border rounded h-7 text-[10px] px-2 outline-none"
                                                                />
                                                                <input 
                                                                    type="text" 
                                                                    placeholder="Error Message"
                                                                    value={v.errorMessage || ''}
                                                                    onChange={(e) => {
                                                                        const vCopy = [...field.validations]; vCopy[vIdx].errorMessage = e.target.value;
                                                                        updateField(index, { validations: vCopy })
                                                                    }}
                                                                    className="bg-background border rounded h-7 text-[10px] px-2 outline-none"
                                                                />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Events */}
                                            <div className="space-y-3 mt-4 lg:mt-0 pt-4 lg:pt-0 border-t lg:border-t-0">
                                                <div className="flex items-center justify-between">
                                                    <h5 className="text-[11px] font-black uppercase text-amber-500 tracking-tighter flex items-center gap-1.5">
                                                        <Zap size={12} /> Interactions
                                                    </h5>
                                                    <Button variant="ghost" size="sm" onClick={() => {
                                                        const eList = [...(field.events || [])]
                                                        eList.push({ trigger: 'onBlur', action: 'EXECUTE_ENDPOINT' })
                                                        updateField(index, { events: eList })
                                                    }} className="h-6 text-[10px] px-2 bg-amber-500/5">
                                                        + ADD LOGIC
                                                    </Button>
                                                </div>
                                                <div className="space-y-2">
                                                    {(field.events || []).map((ev: any, eIdx: number) => (
                                                        <div key={eIdx} className="bg-muted p-2 rounded-lg space-y-2 border border-amber-500/10">
                                                            <div className="flex gap-2">
                                                                <select 
                                                                    value={ev.trigger}
                                                                    onChange={(e) => {
                                                                        const eCopy = [...field.events]; eCopy[eIdx].trigger = e.target.value;
                                                                        updateField(index, { events: eCopy })
                                                                    }}
                                                                    className="flex-1 bg-background border rounded h-7 text-[10px] px-1 outline-none"
                                                                >
                                                                    <option value="onChange">On Change</option>
                                                                    <option value="onBlur">On Blur</option>
                                                                    <option value="onLoad">On Load</option>
                                                                </select>
                                                                <select 
                                                                    value={ev.action}
                                                                    onChange={(e) => {
                                                                        const eCopy = [...field.events]; eCopy[eIdx].action = e.target.value;
                                                                        updateField(index, { events: eCopy })
                                                                    }}
                                                                    className="flex-1 bg-background border rounded h-7 text-[10px] px-1 outline-none"
                                                                >
                                                                    <option value="EXECUTE_ENDPOINT">Run API</option>
                                                                    <option value="SET_VALUE">Set Value</option>
                                                                </select>
                                                                <button onClick={() => {
                                                                    updateField(index, { events: field.events.filter((_: any, i: number) => i !== eIdx) })
                                                                }} className="text-destructive p-1 hover:bg-destructive/10 rounded transition-colors"><Trash size={12} /></button>
                                                            </div>
                                                            {ev.action === 'EXECUTE_ENDPOINT' && (
                                                                <select 
                                                                    value={ev.endpointId || ''}
                                                                    onChange={(e) => {
                                                                        const eCopy = [...field.events]; eCopy[eIdx].endpointId = e.target.value;
                                                                        updateField(index, { events: eCopy })
                                                                    }}
                                                                    className="w-full bg-background border rounded h-7 text-[10px] px-2 outline-none font-mono"
                                                                >
                                                                    <option value="">Endpoint...</option>
                                                                    {endpoints.map(ep => (
                                                                        <option key={ep.id} value={ep.id}>{ep.name}</option>
                                                                    ))}
                                                                </select>
                                                            )}
                                                            <textarea 
                                                                placeholder='{"localKey": "$.api.path"}'
                                                                value={ev.mappingConfig ? JSON.stringify(ev.mappingConfig) : ''}
                                                                onChange={(e) => {
                                                                    try {
                                                                        const eCopy = [...field.events]; eCopy[eIdx].mappingConfig = JSON.parse(e.target.value);
                                                                        updateField(index, { events: eCopy })
                                                                    } catch { /* typing */ }
                                                                }}
                                                                className="w-full bg-background border rounded h-12 p-1 text-[9px] font-mono outline-none"
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </div>
                    </div>

                    <div className="flex flex-row sm:flex-col items-center justify-between sm:border-l pt-3 sm:pt-0 sm:pl-4 sm:ml-2 border-t sm:border-t-0 mt-2 sm:mt-0">
                        <button type="button" onClick={() => removeField(index)} className="text-muted-foreground hover:text-destructive p-2 rounded-lg bg-destructive/5 sm:bg-transparent transition-colors">
                            <Trash className="h-5 w-5 sm:h-4 sm:w-4" />
                        </button>
                        <div className="flex flex-row sm:flex-col items-center gap-2 sm:gap-1 sm:mt-auto sm:pb-1 bg-accent/5 px-3 py-1 sm:p-0 rounded-lg sm:bg-transparent">
                            <label className="text-[11px] font-black uppercase text-muted-foreground">REQ</label>
                            <input
                                type="checkbox"
                                checked={!!field.required}
                                onChange={(e) => updateField(index, { required: e.target.checked })}
                                className="w-4 h-4 sm:w-3.5 sm:h-3.5 accent-primary"
                            />
                        </div>
                    </div>
                </div>
            ))}

            <Button type="button" variant="outline" onClick={addField} className="w-full border-dashed py-10 bg-accent/10 hover:bg-accent/30 text-muted-foreground hover:text-foreground">
                <Plus className="mr-2 h-4 w-4" /> Add Application Field
            </Button>
        </div>
    )
}
