"use client";

import React, { useState } from "react";
import { FormField } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus, GripVertical, Settings2, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface SchemaFieldEditorProps {
    fields: FormField[];
    onChange: (fields: FormField[]) => void;
}

export function SchemaFieldEditor({ fields, onChange }: SchemaFieldEditorProps) {
    const [editingFieldId, setEditingFieldId] = useState<string | null>(null);

    const handleAddField = () => {
        const newField: FormField = {
            id: `field_${Date.now()}`,
            label: "New Field",
            type: "text",
            required: false,
        };
        onChange([...fields, newField]);
    };

    const handleRemoveField = (id: string) => {
        onChange(fields.filter(f => f.id !== id));
    };

    const handleUpdateField = (id: string, updates: Partial<FormField>) => {
        onChange(fields.map(f => f.id === id ? { ...f, ...updates } : f));
    };

    const moveField = (index: number, direction: 'up' | 'down') => {
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= fields.length) return;
        const newFields = [...fields];
        const temp = newFields[index];
        newFields[index] = newFields[newIndex];
        newFields[newIndex] = temp;
        onChange(newFields);
    };

    const editingField = fields.find(f => f.id === editingFieldId);

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
                        <div key={field.id} className="flex items-center gap-3 p-3 bg-card border rounded-lg shadow-sm group">
                            <div className="flex flex-col gap-1 cursor-ns-resize opacity-30 hover:opacity-100 transition-opacity">
                                <Button type="button" variant="ghost" size="icon" className="h-4 w-4" onClick={() => moveField(index, 'up')} disabled={index === 0}>
                                    <GripVertical className="h-3 w-3" />
                                </Button>
                            </div>
                            
                            <div className="flex-1 grid grid-cols-12 gap-4 items-center">
                                <div className="col-span-4">
                                    <Input 
                                        value={field.label} 
                                        onChange={(e) => handleUpdateField(field.id, { label: e.target.value })}
                                        className="h-8 text-sm"
                                        placeholder="Field Label"
                                    />
                                </div>
                                <div className="col-span-3">
                                    <Input 
                                        value={field.id} 
                                        onChange={(e) => handleUpdateField(field.id, { id: e.target.value.replace(/\s+/g, '_').toLowerCase() })}
                                        className="h-8 text-sm font-mono"
                                        placeholder="field_id"
                                    />
                                </div>
                                <div className="col-span-3">
                                    <Select 
                                        value={field.type} 
                                        onValueChange={(val: any) => handleUpdateField(field.id, { type: val })}
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
                                        onClick={() => setEditingFieldId(field.id)}
                                    >
                                        <Settings2 className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                        type="button" 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                        onClick={() => handleRemoveField(field.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <Dialog open={!!editingFieldId} onOpenChange={(open) => !open && setEditingFieldId(null)}>
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
                                    onCheckedChange={(checked) => handleUpdateField(editingField.id, { required: !!checked })}
                                />
                                <Label htmlFor="required">Required Field</Label>
                            </div>
                            
                            <div className="space-y-2">
                                <Label>Placeholder Text</Label>
                                <Input 
                                    value={editingField.placeholder || ''} 
                                    onChange={(e) => handleUpdateField(editingField.id, { placeholder: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Helper Description</Label>
                                <Input 
                                    value={editingField.description || ''} 
                                    onChange={(e) => handleUpdateField(editingField.id, { description: e.target.value })}
                                />
                            </div>

                            {editingField.type === 'select' && (
                                <div className="space-y-2">
                                    <Label>Options (comma separated)</Label>
                                    <Input 
                                        value={(editingField.options || []).join(', ')} 
                                        onChange={(e) => handleUpdateField(editingField.id, { options: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                                        placeholder="Option 1, Option 2, Option 3"
                                    />
                                </div>
                            )}

                            {/* Complex validations & events can be expanded here later */}
                            <div className="p-3 bg-muted/50 rounded-lg border border-dashed">
                                <p className="text-xs text-muted-foreground">Advanced validations and conditional events are supported by the schema but are configured via JSON in the current version.</p>
                            </div>
                        </div>
                    )}
                    <div className="flex justify-end">
                        <Button onClick={() => setEditingFieldId(null)}>Done</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
