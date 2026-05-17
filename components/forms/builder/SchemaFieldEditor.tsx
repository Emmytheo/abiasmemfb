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

interface SchemaFieldEditorProps {
    fields: FormField[];
    onChange: (fields: FormField[]) => void;
}

export function SchemaFieldEditor({ fields, onChange }: SchemaFieldEditorProps) {
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
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
                        <div key={keysRef.current[index] || index} className="flex items-center gap-3 p-3 bg-card border rounded-lg shadow-sm group">
                            <div className="flex flex-col gap-1 cursor-ns-resize opacity-30 hover:opacity-100 transition-opacity">
                                <Button type="button" variant="ghost" size="icon" className="h-4 w-4" onClick={() => moveField(index, 'up')} disabled={index === 0}>
                                    <GripVertical className="h-3 w-3" />
                                </Button>
                            </div>
                            
                            <div className="flex-1 grid grid-cols-12 gap-4 items-center">
                                <div className="col-span-4">
                                    <Input 
                                        value={field.label} 
                                        onChange={(e) => handleUpdateField(index, { label: e.target.value })}
                                        className="h-8 text-sm"
                                        placeholder="Field Label"
                                    />
                                </div>
                                <div className="col-span-3">
                                    <Input 
                                        value={field.id} 
                                        onChange={(e) => handleUpdateField(index, { id: e.target.value.replace(/\s+/g, '_').toLowerCase() })}
                                        className="h-8 text-sm font-mono"
                                        placeholder="field_id"
                                    />
                                </div>
                                <div className="col-span-3">
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
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="col-span-2 flex items-center justify-end gap-2">
                                    <Button 
                                        type="button" 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                                        onClick={() => setEditingIndex(index)}
                                    >
                                        <Settings2 className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                        type="button" 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                        onClick={() => handleRemoveField(index)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
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

                            {editingField.type === 'select' && (
                                <div className="space-y-2">
                                    <Label>Options (comma separated)</Label>
                                    <Input 
                                        value={(editingField.options || []).join(', ')} 
                                        onChange={(e) => handleUpdateField(editingIndex!, { options: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                                        placeholder="Option 1, Option 2, Option 3"
                                    />
                                </div>
                            )}

                            <div className="p-3 bg-muted/50 rounded-lg border border-dashed">
                                <p className="text-xs text-muted-foreground">Advanced validations and conditional events are supported by the schema but are configured via JSON in the current version.</p>
                            </div>
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
