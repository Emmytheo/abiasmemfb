"use client";

import * as React from "react";
import { GenericDataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Plus, Eye, Trash, Code, Settings2, ShieldAlert, Zap } from "lucide-react";
import { toast } from "sonner";
import { FormFieldBuilder } from "@/components/forms/builder/FormFieldBuilder";

import { api } from "@/lib/api";
import { Service, ServiceCategory } from "@/lib/api/types";

export default function ServicesPage() {
    const [data, setData] = React.useState<Service[]>([]);
    const [categories, setCategories] = React.useState<ServiceCategory[]>([]);
    const [workflows, setWorkflows] = React.useState<{ id: string, name: string }[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [isCreateOpen, setIsCreateOpen] = React.useState(false);
    const [endpoints, setEndpoints] = React.useState<any[]>([]);

    const [newServiceSchema, setNewServiceSchema] = React.useState<any[]>([]);

    const [selectedItem, setSelectedItem] = React.useState<Service | null>(null);
    const [isViewOpen, setIsViewOpen] = React.useState(false);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [servicesReq, categoriesReq, workflowsReq, endpointsReq] = await Promise.all([
                api.getAllServices(),
                api.getServiceCategories(),
                api.getWorkflows(),
                (api as any).getAllEndpoints?.() || Promise.resolve([])
            ]);
            setData(servicesReq);
            setCategories(categoriesReq);
            setWorkflows(workflowsReq.docs || []);
            setEndpoints(endpointsReq.docs || endpointsReq || []);
        } catch (error) {
            console.error("Failed to load services:", error);
        } finally {
            setIsLoading(false);
        }
    };

    React.useEffect(() => {
        fetchData();
    }, []);

    const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        let parsedSchema = [];
        try {
            const schemaStr = formData.get("form_schema") as string;
            if (schemaStr) parsedSchema = JSON.parse(schemaStr);
        } catch (e) {
            toast.error("Invalid JSON in Form Schema");
            return;
        }

        const executionWf = formData.get("execution_workflow") as string;
        const validationWf = formData.get("validation_workflow") as string;
        const categoryId = formData.get("category") as string;

        if (!categoryId) {
            toast.error("Please select a Category.");
            return;
        }

        try {
            const newService = await api.createService({
                name: formData.get("name") as string,
                category: categoryId,
                provider: undefined, // Setup later or manually
                provider_service_code: formData.get("provider_service_code") as string,
                validation_workflow: validationWf || undefined,
                execution_workflow: executionWf || undefined,
                fee_type: formData.get("fee_type") as any,
                fee_value: Number(formData.get("fee_value")) || 0,
                form_schema: newServiceSchema,
                status: "active",
            });

            // To update UI instantly we need the Category Name, but API returns Category ID.
            // A hard refresh is safer since it joins data.
            toast.success("Service created successfully.");
            setIsCreateOpen(false);
            fetchData();
        } catch (error) {
            toast.error("Failed to create service.");
        }
    };

    const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!selectedItem) return;

        const formData = new FormData(e.currentTarget);

        let parsedSchema = [];
        try {
            const schemaStr = formData.get("form_schema") as string;
            if (schemaStr) parsedSchema = JSON.parse(schemaStr);
        } catch (e) {
            toast.error("Invalid JSON in Form Schema");
            return;
        }

        const executionWf = formData.get("execution_workflow") as string;
        const validationWf = formData.get("validation_workflow") as string;
        const categoryId = formData.get("category") as string;

        if (!categoryId) {
            toast.error("Please select a Category.");
            return;
        }

        try {
            await api.updateService(selectedItem.id, {
                name: formData.get("name") as string,
                category: categoryId,
                provider_service_code: formData.get("provider_service_code") as string,
                validation_workflow: validationWf || undefined,
                execution_workflow: executionWf || undefined,
                fee_type: formData.get("fee_type") as any,
                fee_value: Number(formData.get("fee_value")) || 0,
                form_schema: selectedItem.form_schema,
                status: formData.get("status") as 'active' | 'inactive',
            });
            toast.success("Service updated successfully.");
            setIsViewOpen(false);
            fetchData();
        } catch (error) {
            toast.error("Failed to update service.");
        }
    };

    const handleDelete = (id: string) => {
        toast("Are you sure you want to delete this service?", {
            action: {
                label: "Delete",
                onClick: async () => {
                    try {
                        await api.deleteService(id);
                        setData(prev => prev.filter(item => item.id !== id));
                        toast.success("Service deleted.");
                    } catch (error) {
                        toast.error("Failed to delete service.");
                    }
                }
            },
            cancel: {
                label: "Cancel",
                onClick: () => { }
            }
        });
    };

    const actionColumn = {
        header: "Actions",
        accessorKey: "id",
        cell: (item: Service) => (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => { setSelectedItem(item); setIsViewOpen(true); }}>
                        <Eye className="mr-2 h-4 w-4" /> View / Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(item.id)}>
                        <Trash className="mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        )
    };

    return (
        <div className="space-y-4">
            <GenericDataTable
                title="Active Services"
                description="Manage specific executable services and their dynamic schemas."
                data={data}
                searchPlaceholder="Search services..."
                searchKey="name"
                actionButton={
                    <Sheet open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <SheetTrigger asChild>
                            <Button className="shrink-0">
                                <Plus className="mr-2 h-4 w-4" /> Add Service
                            </Button>
                        </SheetTrigger>
                        <SheetContent className="overflow-y-auto w-full sm:max-w-xl p-4 sm:p-6">
                            <SheetHeader className="mb-6">
                                <SheetTitle>Create New Service</SheetTitle>
                                <SheetDescription>
                                    Define an executable service and its required JSON UI form fields.
                                </SheetDescription>
                            </SheetHeader>
                            <form onSubmit={handleCreate} className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Service Name</Label>
                                        <Input id="name" name="name" required placeholder="e.g. DSTV Premium" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="category">Category</Label>
                                        <select
                                            id="category"
                                            name="category"
                                            required
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            <option value="" disabled selected>Select Category</option>
                                            {categories.map(cat => (
                                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="fee_type">Fee Type</Label>
                                        <select
                                            id="fee_type"
                                            name="fee_type"
                                            required
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            <option value="none">None (Zero Fee)</option>
                                            <option value="flat">Flat Fee</option>
                                            <option value="percentage">Percentage (%)</option>
                                            <option value="tiered">Tiered (Complex)</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="fee_value">Fee / Surcharge Value</Label>
                                        <Input id="fee_value" name="fee_value" type="number" step="0.01" defaultValue={0} required />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="validation_workflow">Validation Workflow (Optional)</Label>
                                        <select
                                            id="validation_workflow"
                                            name="validation_workflow"
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            <option value="">None</option>
                                            {workflows.map(wf => (
                                                <option key={wf.id} value={wf.id}>{wf.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="execution_workflow">Execution Workflow <span className="text-destructive">*</span></Label>
                                        <select
                                            id="execution_workflow"
                                            name="execution_workflow"
                                            required
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            <option value="" disabled selected>Select Workflow</option>
                                            {workflows.map(wf => (
                                                <option key={wf.id} value={wf.id}>{wf.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="provider_service_code">Provider Internal Code (Optional)</Label>
                                    <Input id="provider_service_code" name="provider_service_code" placeholder="e.g. NGP-ELEC-01" />
                                </div>

                                <div className="space-y-4 pt-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Code className="h-4 w-4 text-primary" />
                                        <Label className="text-xs font-bold uppercase tracking-widest">Service Form Schema</Label>
                                    </div>
                                    <FormFieldBuilder 
                                        idKey="name"
                                        fields={newServiceSchema}
                                        endpoints={endpoints}
                                        onChange={setNewServiceSchema}
                                    />
                                    <p className="text-[10px] text-muted-foreground italic">Fields defined here will be collected from the user to execute this service.</p>
                                </div>
                                <div className="pt-4 flex justify-end gap-2">
                                    <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                                    <Button type="submit">Create Service</Button>
                                </div>
                            </form>
                        </SheetContent>
                    </Sheet>
                }
                columns={[
                    { header: "Name", accessorKey: "name", cell: (item) => <span className="font-semibold">{item.name}</span> },
                    { header: "Category", accessorKey: "category", cell: (item) => <span className="text-muted-foreground">{item.category}</span> },
                    { header: "Fee Type", accessorKey: "fee_type", cell: (item) => <span className="capitalize">{item.fee_type}</span> },
                    { header: "Status", accessorKey: "status", cell: (item) => <span className="capitalize text-green-600 bg-green-100 px-2 py-1 rounded-full text-xs">{item.status}</span> },
                    actionColumn
                ]}
                gridRenderItem={(item) => (
                    <div key={item.id} className="border bg-card rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between flex-wrap gap-2 items-start mb-2">
                            <h3 className="font-semibold text-lg">{item.name}</h3>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0 -mt-2 -mr-2">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => { setSelectedItem(item); setIsViewOpen(true); }}>
                                        <Eye className="mr-2 h-4 w-4" /> View / Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(item.id)}>
                                        <Trash className="mr-2 h-4 w-4" /> Delete
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                        <div className="space-y-1 mb-4 mt-2">
                            <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Category: </span> {item.category}</p>
                            <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Fee Policy: </span> {item.fee_type} ({item.fee_value})</p>
                            <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Inputs: </span> {item.form_schema?.length || 0} fields mapped.</p>
                        </div>
                        <div className="flex justify-start">
                            <span className="capitalize text-green-600 bg-green-100 px-2 py-1 rounded-full text-xs font-medium">{item.status}</span>
                        </div>
                    </div>
                )}
            />

            {/* View/Edit Modal via Sheet */}
            <Sheet open={isViewOpen} onOpenChange={setIsViewOpen}>
                <SheetContent className="overflow-y-auto w-full sm:max-w-xl p-4 sm:p-6">
                    <SheetHeader className="mb-6">
                        <SheetTitle>Edit Service</SheetTitle>
                        <SheetDescription>
                            Modify execution parameters and payload schemas.
                        </SheetDescription>
                    </SheetHeader>
                    {selectedItem && (
                        <form onSubmit={handleUpdate} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Service ID</Label>
                                <Input value={selectedItem.id} disabled className="bg-muted text-xs font-mono" />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="edit-name">Service Name</Label>
                                    <Input id="edit-name" name="name" defaultValue={selectedItem.name} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-category">Category</Label>
                                    {/* For dropdown to work correctly, selectedItem.category should ideally be an ID, but backend returned name logic in getAllServices complicates this locally.
                                        We map over available categories, attempting a match. Note: the `api.getAllServices()` stringifies the category name. 
                                        To properly update we need the ID. Let's find the matching category ID. */}
                                    <select
                                        id="edit-category"
                                        name="category"
                                        required
                                        defaultValue={categories.find(c => c.name === selectedItem.category || c.id === selectedItem.category)?.id}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="edit-fee_type">Fee Type</Label>
                                    <select
                                        id="edit-fee_type"
                                        name="fee_type"
                                        required
                                        defaultValue={selectedItem.fee_type}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <option value="none">None (Zero Fee)</option>
                                        <option value="flat">Flat</option>
                                        <option value="percentage">Percentage (%)</option>
                                        <option value="tiered">Tiered (Complex)</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-fee_value">Fee / Surcharge Value</Label>
                                    <Input id="edit-fee_value" name="fee_value" type="number" step="0.01" defaultValue={selectedItem.fee_value} required />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="edit-validation_workflow">Validation Workflow (Optional)</Label>
                                    <select
                                        id="edit-validation_workflow"
                                        name="validation_workflow"
                                        defaultValue={typeof selectedItem.validation_workflow === 'object' ? (selectedItem.validation_workflow as any)?.id : selectedItem.validation_workflow || ''}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <option value="">None</option>
                                        {workflows.map(wf => (
                                            <option key={wf.id} value={wf.id}>{wf.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-execution_workflow">Execution Workflow <span className="text-destructive">*</span></Label>
                                    <select
                                        id="edit-execution_workflow"
                                        name="execution_workflow"
                                        required
                                        defaultValue={typeof selectedItem.execution_workflow === 'object' ? (selectedItem.execution_workflow as any)?.id : selectedItem.execution_workflow || ''}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <option value="" disabled>Select Workflow</option>
                                        {workflows.map(wf => (
                                            <option key={wf.id} value={wf.id}>{wf.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="edit-provider_service_code">Provider Internal Code (Optional)</Label>
                                <Input id="edit-provider_service_code" name="provider_service_code" defaultValue={selectedItem.provider_service_code} />
                            </div>

                            <div className="space-y-4 pt-4 border-t">
                                <div className="flex items-center gap-2 mb-2">
                                    <Code className="h-4 w-4 text-primary" />
                                    <Label className="text-xs font-bold uppercase tracking-widest">Edit Form Schema</Label>
                                </div>
                                <FormFieldBuilder 
                                    idKey="name"
                                    fields={selectedItem.form_schema}
                                    endpoints={endpoints}
                                    onChange={(updated) => setSelectedItem({...selectedItem, form_schema: updated})}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="edit-status">Status</Label>
                                <select
                                    id="edit-status"
                                    name="status"
                                    defaultValue={selectedItem.status}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>

                            <div className="pt-6 flex justify-end gap-2 border-t">
                                <Button type="button" variant="outline" onClick={() => setIsViewOpen(false)}>Close</Button>
                                <Button type="submit">Save Changes</Button>
                            </div>
                        </form>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
}
