"use client";

import React, { useState, useRef } from "react";
import { FormField } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus, GripVertical, Settings2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ShieldAlert, Zap } from "lucide-react";

interface SchemaFieldEditorProps {
    fields: any[];
    onChange: (fields: any[]) => void;
    endpoints?: any[];
    idKey?: 'id' | 'name';
}

export function SchemaFieldEditor({ fields, onChange, endpoints = [], idKey = 'id' }: SchemaFieldEditorProps) {
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const keysRef = useRef<string[]>([]);

    // Align key reference list with incoming fields length
    if (keysRef.current.length !== fields.length) {
        if (keysRef.current.length < fields.length) {
            const needed = fields.length - keysRef.current.length;
            for (let i = 0; i < needed; i++) {
                keysRef.current.push(`key_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
            }
        } else {
            keysRef.current = keysRef.current.slice(0, fields.length);
        }
    }

    const handleAddField = () => {
        const newField: FormField = {
            id: `field_${Date.now()}`,
            label: "New Field",
            type: "text",
            required: false,
        };
        keysRef.current.push(`key_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
        onChange([...fields, newField]);
    };

    const handleRemoveField = (index: number) => {
        keysRef.current.splice(index, 1);
        onChange(fields.filter((_, i) => i !== index));
        if (editingIndex === index) {
            setEditingIndex(null);
        } else if (editingIndex !== null && editingIndex > index) {
            setEditingIndex(editingIndex - 1);
        }
    };

    const handleUpdateField = (index: number, updates: Partial<FormField>) => {
        const newFields = [...fields];
        newFields[index] = { ...newFields[index], ...updates };
        onChange(newFields);
    };

    const moveField = (index: number, direction: 'up' | 'down') => {
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= fields.length) return;

        // Swap stable key references
        const tempKey = keysRef.current[index];
        keysRef.current[index] = keysRef.current[newIndex];
        keysRef.current[newIndex] = tempKey;

        const newFields = [...fields];
        const temp = newFields[index];
        newFields[index] = newFields[newIndex];
        newFields[newIndex] = temp;

        onChange(newFields);

        // Adjust editing index if active
        if (editingIndex === index) {
            setEditingIndex(newIndex);
        } else if (editingIndex === newIndex) {
            setEditingIndex(index);
        }
    };

    // Drag and Drop
    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === index) return;
        
        // Swap keysRef
        const tempKey = keysRef.current[draggedIndex];
        keysRef.current[draggedIndex] = keysRef.current[index];
        keysRef.current[index] = tempKey;

        const newFields = [...fields];
        const draggedItem = newFields[draggedIndex];
        newFields.splice(draggedIndex, 1);
        newFields.splice(index, 0, draggedItem);
        onChange(newFields);
        setDraggedIndex(index);
    };

    const editingField = editingIndex !== null ? fields[editingIndex] : null;

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-sm font-semibold">Form Fields ({fields.length})</h3>
                <Button type="button" variant="outline" size="sm" onClick={handleAddField}>
                    <Plus className="h-4 w-4 mr-2" /> Add Field
                </Button>
            </div>

            <div className="space-y-3">
                {fields.length === 0 ? (
                    <div className="p-8 text-center border border-dashed rounded-xl bg-muted/20">
                        <p className="text-sm text-muted-foreground">No fields configured. Add one to get started.</p>
                    </div>
                ) : (
                    fields.map((field, index) => (
                        <div 
                            key={keysRef.current[index] || index} 
                            draggable
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDragEnd={() => setDraggedIndex(null)}
                            className={`flex items-center gap-3 p-3 bg-card border rounded-lg shadow-sm group transition-all ${draggedIndex === index ? 'opacity-40 border-primary border-dashed' : 'hover:border-primary/50'}`}
                        >
                            <div className="flex flex-col gap-1 cursor-grab active:cursor-grabbing opacity-30 hover:opacity-100 transition-opacity">
                                <GripVertical className="h-4 w-4" />
                            </div>
                            
                            <div className="flex-1 flex flex-col md:grid md:grid-cols-12 gap-3 md:gap-4 md:items-center">
                                <div className="w-full md:col-span-4">
                                    <Input 
                                        value={field.label} 
                                        onChange={(e) => handleUpdateField(index, { label: e.target.value })}
                                        className="h-8 text-sm"
                                        placeholder="Field Label"
                                    />
                                </div>
                                <div className="w-full md:col-span-3">
                                    <Input 
                                        value={idKey === 'id' ? field.id : (field as any).name || ''} 
                                        onChange={(e) => handleUpdateField(index, idKey === 'id' ? { id: e.target.value.replace(/\s+/g, '_').toLowerCase() } : { name: e.target.value.replace(/\s+/g, '_').toLowerCase() } as any)}
                                        className="h-8 text-sm font-mono"
                                        placeholder={idKey === 'id' ? "field_id" : "variable_name"}
                                    />
                                </div>
                                <div className="w-full flex md:contents gap-3 items-center">
                                    <div className="flex-1 md:col-span-3">
                                        <Select 
                                            value={field.type} 
                                            onValueChange={(val: any) => handleUpdateField(index, { type: val })}
                                        >
                                            <SelectTrigger className="h-8 text-sm">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="text">Text</SelectItem>
                                                <SelectItem value="number">Number</SelectItem>
                                                <SelectItem value="email">Email</SelectItem>
                                                <SelectItem value="select">Select</SelectItem>
                                                <SelectItem value="file">File Upload</SelectItem>
                                                <SelectItem value="destination_bank_lookup">Bank Lookup</SelectItem>
                                                <SelectItem value="beneficiary_select">Beneficiary</SelectItem>
                                                <SelectItem value="autocomplete_select">Autocomplete Select</SelectItem>
                                                <SelectItem value="api_select">API Select</SelectItem>
                                                <SelectItem value="hidden">Hidden Metadata</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="md:col-span-2 flex items-center justify-end gap-2 shrink-0">
                                        <Button 
                                            type="button" 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-8 w-8 text-muted-foreground hover:text-primary bg-muted/50 md:bg-transparent"
                                            onClick={() => setEditingIndex(index)}
                                        >
                                            <Settings2 className="h-4 w-4" />
                                        </Button>
                                        <Button 
                                            type="button" 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-8 w-8 text-destructive hover:bg-destructive/10 bg-destructive/5 md:bg-transparent"
                                            onClick={() => handleRemoveField(index)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <Dialog open={editingIndex !== null} onOpenChange={(open) => !open && setEditingIndex(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Field Settings</DialogTitle>
                    </DialogHeader>
                    {editingField && (
                        <div className="space-y-4 py-4">
                            <div className="flex items-center space-x-2">
                                <Checkbox 
                                    id="required" 
                                    checked={editingField.required}
                                    onCheckedChange={(checked) => handleUpdateField(editingIndex!, { required: !!checked })}
                                />
                                <Label htmlFor="required">Required Field</Label>
                            </div>
                            
                            <div className="space-y-2">
                                <Label>Placeholder Text</Label>
                                <Input 
                                    value={editingField.placeholder || ''} 
                                    onChange={(e) => handleUpdateField(editingIndex!, { placeholder: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Helper Description</Label>
                                <Input 
                                    value={editingField.description || ''} 
                                    onChange={(e) => handleUpdateField(editingIndex!, { description: e.target.value })}
                                />
                            </div>

                            {(editingField.type === 'select' || editingField.type === 'autocomplete_select') && (
                                <div className="space-y-2">
                                    <Label>Options (comma separated)</Label>
                                    <Input 
                                        value={Array.isArray(editingField.options) ? editingField.options.join(', ') : editingField.options || ''} 
                                        onChange={(e) => handleUpdateField(editingIndex!, { options: idKey === 'id' ? e.target.value.split(',').map(s => s.trim()).filter(Boolean) : e.target.value } as any)}
                                        placeholder="Option 1, Option 2, Option 3"
                                    />
                                </div>
                            )}

                            {editingField.type === 'api_select' && (
                                <div className="space-y-3 p-3 bg-muted/40 rounded-lg border">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs">API Options Endpoint</Label>
                                        {endpoints && endpoints.length > 0 ? (
                                            <Select 
                                                value={editingField.options_endpoint || editingField.optionsEndpoint || ''} 
                                                onValueChange={(val) => handleUpdateField(editingIndex!, { options_endpoint: val } as any)}
                                            >
                                                <SelectTrigger className="h-8 text-xs">
                                                    <SelectValue placeholder="Select endpoint..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {endpoints.map((ep: any) => (
                                                        <SelectItem key={ep.id} value={ep.id}>{ep.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        ) : (
                                            <Input 
                                                value={editingField.options_endpoint || editingField.optionsEndpoint || ''} 
                                                onChange={(e) => handleUpdateField(editingIndex!, { options_endpoint: e.target.value } as any)}
                                                className="h-8 text-xs font-mono"
                                                placeholder="Endpoint ID or Path"
                                            />
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="space-y-1.5">
                                            <Label className="text-[11px]">Text Key</Label>
                                            <Input 
                                                value={editingField.options_text_key || editingField.optionsTextKey || ''} 
                                                onChange={(e) => handleUpdateField(editingIndex!, { options_text_key: e.target.value } as any)}
                                                className="h-8 text-xs"
                                                placeholder="e.g. name"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-[11px]">Value Key</Label>
                                            <Input 
                                                value={editingField.options_value_key || editingField.optionsValueKey || ''} 
                                                onChange={(e) => handleUpdateField(editingIndex!, { options_value_key: e.target.value } as any)}
                                                className="h-8 text-xs"
                                                placeholder="e.g. code"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Advanced Validations & Events */}
                            <Accordion type="single" collapsible className="w-full">
                                <AccordionItem value="advanced" className="border-none">
                                    <AccordionTrigger className="py-2 text-muted-foreground hover:text-primary">
                                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
                                            <Settings2 className="h-3.5 w-3.5" /> Logical Validations & Events
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="pt-2 space-y-6">
                                        
                                        {/* Validations */}
                                        <div className="space-y-3 bg-muted/30 p-3 rounded-lg border">
                                            <div className="flex items-center justify-between">
                                                <h5 className="text-[11px] font-black uppercase text-primary flex items-center gap-1.5">
                                                    <ShieldAlert size={12} /> Validations
                                                </h5>
                                                <Button type="button" variant="ghost" size="sm" onClick={() => {
                                                    const v = [...(editingField.validations || [])];
                                                    v.push({ type: 'regex', value: '', errorMessage: '' });
                                                    handleUpdateField(editingIndex!, { validations: v });
                                                }} className="h-6 text-[10px] px-2 bg-primary/10">
                                                    + ADD RULE
                                                </Button>
                                            </div>
                                            {(editingField.validations || []).map((v: any, vIdx: number) => (
                                                <div key={vIdx} className="bg-background p-2 rounded border space-y-2">
                                                    <div className="flex gap-2">
                                                        <select value={v.type} onChange={(e) => {
                                                            const vCopy = [...(editingField.validations || [])]; vCopy[vIdx].type = e.target.value as any;
                                                            handleUpdateField(editingIndex!, { validations: vCopy });
                                                        }} className="flex-1 bg-muted border rounded h-7 text-xs px-1">
                                                            <option value="regex">Pattern (Regex)</option>
                                                            <option value="min">Min Value</option>
                                                            <option value="max">Max Value</option>
                                                        </select>
                                                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => {
                                                            handleUpdateField(editingIndex!, { validations: (editingField.validations || []).filter((_: any, i: number) => i !== vIdx) });
                                                        }}><Trash2 className="h-3 w-3" /></Button>
                                                    </div>
                                                    <Input placeholder="Limit / Regex Pattern" value={v.value || ''} onChange={(e) => {
                                                        const vCopy = [...(editingField.validations || [])]; vCopy[vIdx].value = e.target.value;
                                                        handleUpdateField(editingIndex!, { validations: vCopy });
                                                    }} className="h-7 text-xs" />
                                                    <Input placeholder="Error Message" value={v.errorMessage || ''} onChange={(e) => {
                                                        const vCopy = [...(editingField.validations || [])]; vCopy[vIdx].errorMessage = e.target.value;
                                                        handleUpdateField(editingIndex!, { validations: vCopy });
                                                    }} className="h-7 text-xs" />
                                                </div>
                                            ))}
                                        </div>

                                        {/* Events */}
                                        <div className="space-y-3 bg-amber-500/5 p-3 rounded-lg border border-amber-500/10">
                                            <div className="flex items-center justify-between">
                                                <h5 className="text-[11px] font-black uppercase text-amber-500 flex items-center gap-1.5">
                                                    <Zap size={12} /> Interactions
                                                </h5>
                                                <Button type="button" variant="ghost" size="sm" onClick={() => {
                                                    const ev = [...(editingField.events || [])];
                                                    ev.push({ trigger: 'onBlur', action: 'EXECUTE_ENDPOINT' });
                                                    handleUpdateField(editingIndex!, { events: ev });
                                                }} className="h-6 text-[10px] px-2 bg-amber-500/10 text-amber-600 hover:text-amber-700">
                                                    + ADD EVENT
                                                </Button>
                                            </div>
                                            {(editingField.events || []).map((ev: any, eIdx: number) => (
                                                <div key={eIdx} className="bg-background p-2 rounded border space-y-2">
                                                    <div className="flex gap-2">
                                                        <select value={ev.trigger} onChange={(e) => {
                                                            const eCopy = [...(editingField.events || [])]; eCopy[eIdx].trigger = e.target.value as any;
                                                            handleUpdateField(editingIndex!, { events: eCopy });
                                                        }} className="flex-1 bg-muted border rounded h-7 text-xs px-1">
                                                            <option value="onChange">On Change</option>
                                                            <option value="onBlur">On Blur</option>
                                                            <option value="onLoad">On Load</option>
                                                        </select>
                                                        <select value={ev.action} onChange={(e) => {
                                                            const eCopy = [...(editingField.events || [])]; eCopy[eIdx].action = e.target.value as any;
                                                            handleUpdateField(editingIndex!, { events: eCopy });
                                                        }} className="flex-1 bg-muted border rounded h-7 text-xs px-1">
                                                            <option value="EXECUTE_ENDPOINT">API Call</option>
                                                            <option value="SET_VALUE">Set Value</option>
                                                        </select>
                                                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => {
                                                            handleUpdateField(editingIndex!, { events: (editingField.events || []).filter((_: any, i: number) => i !== eIdx) });
                                                        }}><Trash2 className="h-3 w-3" /></Button>
                                                    </div>
                                                    {ev.action === 'EXECUTE_ENDPOINT' && endpoints.length > 0 && (
                                                        <select value={ev.endpointId || ''} onChange={(e) => {
                                                            const eCopy = [...(editingField.events || [])]; eCopy[eIdx].endpointId = e.target.value;
                                                            handleUpdateField(editingIndex!, { events: eCopy });
                                                        }} className="w-full bg-muted border rounded h-7 text-xs px-1 font-mono">
                                                            <option value="">Select Endpoint...</option>
                                                            {endpoints.map(ep => (
                                                                <option key={ep.id} value={ep.id}>{ep.name}</option>
                                                            ))}
                                                        </select>
                                                    )}
                                                    <textarea 
                                                        placeholder='Mapping JSON e.g. {"localKey": "$.api.path"}'
                                                        value={ev.mappingConfig ? JSON.stringify(ev.mappingConfig) : ''}
                                                        onChange={(e) => {
                                                            try {
                                                                const eCopy = [...(editingField.events || [])]; eCopy[eIdx].mappingConfig = JSON.parse(e.target.value);
                                                                handleUpdateField(editingIndex!, { events: eCopy });
                                                            } catch {}
                                                        }}
                                                        className="w-full bg-muted border rounded h-12 p-1 text-[10px] font-mono"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>

                        </div>
                    )}
                    <div className="flex justify-end">
                        <Button onClick={() => setEditingIndex(null)}>Done</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
