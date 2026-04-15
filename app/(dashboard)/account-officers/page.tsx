"use client";

import { useEffect, useState } from "react";
import { GenericDataTable } from "@/components/data-table";
import { api, AccountOfficer, User } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, UserCheck, ShieldAlert, UserSquare2, Link2, Ghost } from "lucide-react";
import { toast } from "sonner";
import { StaffLinkDialog } from "@/components/dashboard/StaffLinkDialog";

export default function AccountOfficersPage() {
    const [data, setData] = useState<AccountOfficer[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [selectedOfficer, setSelectedOfficer] = useState<AccountOfficer | null>(null);
    const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);

    async function loadData() {
        setLoading(true);
        try {
            const [officers, allUsers] = await Promise.all([
                api.getAllAccountOfficers(),
                api.getAllUsers()
            ]);
            setData(officers);
            setUsers(allUsers);
        } catch (error) {
            toast.error("Failed to load staff records.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadData();
    }, []);

    const handleSync = async () => {
        setIsSyncing(true);
        toast.info("Establishing Account Officer Sync Stream...", {
            description: "Connecting to Core Banking staff registry."
        });

        const eventSource = new EventSource('/api/sync/officers/stream');

        eventSource.onmessage = (event) => {
            try {
                const log = JSON.parse(event.data);
                if (log.type === 'success') {
                    toast.success("Staff sync complete.");
                    loadData();
                    eventSource.close();
                    setIsSyncing(false);
                }
            } catch (e) {
                console.error("Failed to parse log event", e);
            }
        };

        eventSource.onerror = (error) => {
            console.error("EventSource failed:", error);
            eventSource.close();
            setIsSyncing(false);
            toast.error("Officer sync stream disconnected.");
        };
    };

    const getLinkedUser = (userId?: string) => {
        if (!userId) return null;
        return users.find(u => u.id === userId);
    };

    if (loading && data.length === 0) return <div className="p-8">Loading staff registry...</div>;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-4 md:p-8 border-b md:border-none">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black tracking-tight">Account Officers</h1>
                    <p className="text-sm md:text-base text-muted-foreground mt-1">Manage staff records and digital platform associations.</p>
                </div>
                <Button onClick={handleSync} disabled={isSyncing} variant="default" className="shadow-lg shadow-primary/20 h-11 md:h-10 w-full md:w-auto">
                    <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                    {isSyncing ? 'Syncing...' : 'Sync from Qore'}
                </Button>
            </div>

            <GenericDataTable
                title="Staff Registry"
                description="List of verified account officers synced from Core Banking."
                data={data}
                searchPlaceholder="Search by name, code or branch..."
                searchKey="name"
                columns={[
                    {
                        header: "Staff Member",
                        accessorKey: "name",
                        cell: (item) => (
                            <div className="flex flex-col">
                                <span className="font-bold text-sm">{item.name}</span>
                                <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-black italic">{item.code}</span>
                            </div>
                        )
                    },
                    {
                        header: "Branch / Details",
                        accessorKey: "branch",
                        cell: (item) => (
                            <div className="flex flex-col text-xs font-medium">
                                <span>{item.branch || 'Head Office'}</span>
                                {item.email && <span className="text-muted-foreground text-[10px] lowercase italic">{item.email}</span>}
                            </div>
                        )
                    },
                    {
                        header: "Link Status",
                        accessorKey: "linked_user_id",
                        cell: (item) => {
                            const linkedUser = getLinkedUser(item.linked_user_id);
                            return (
                                <div className="flex items-center gap-2">
                                    {linkedUser ? (
                                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-black text-[10px] uppercase">
                                            <UserCheck className="h-3 w-3 mr-1" /> {linkedUser.full_name}
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 font-black text-[10px] uppercase">
                                            <Ghost className="h-3 w-3 mr-1" /> Unlinked
                                        </Badge>
                                    )}
                                </div>
                            );
                        }
                    },
                    {
                        header: "Action",
                        accessorKey: "id",
                        cell: (item) => (
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => {
                                    setSelectedOfficer(item);
                                    setIsLinkDialogOpen(true);
                                }}
                                className="text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/5"
                            >
                                <Link2 className="h-4 w-4 mr-2" /> 
                                {item.linked_user_id ? "Change Association" : "Link to Admin"}
                            </Button>
                        )
                    }
                ]}
                gridRenderItem={(item) => {
                    const linkedUser = getLinkedUser(item.linked_user_id);
                    return (
                        <div key={item.id} className="relative border rounded-2xl p-6 bg-background shadow-sm hover:shadow-lg transition-all duration-300 group overflow-hidden border-primary/5">
                            <div className="absolute top-0 right-0 p-3">
                                 <Badge variant={linkedUser ? 'default' : 'secondary'} className="capitalize text-[8px] font-black px-2 py-0">
                                    {linkedUser ? 'ACTIVE LINK' : 'SHADOW RECORD'}
                                 </Badge>
                            </div>
                            
                            <div className="flex items-center gap-4 mb-6">
                                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary font-black text-2xl shadow-inner">
                                    {item.name.split(',')[0][0]}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-lg tracking-tight truncate leading-none mb-1">{item.name}</h3>
                                    <p className="text-[10px] text-muted-foreground truncate uppercase font-black tracking-widest italic opacity-60">Code: {item.code}</p>
                                </div>
                            </div>
                            
                            <div className="space-y-3 mb-6">
                                <div className="p-3 rounded-xl bg-muted/30 text-[10px] border border-black/5">
                                    <p className="text-muted-foreground mb-1 uppercase tracking-widest font-black opacity-60">Operations Unit</p>
                                    <p className="font-bold">{item.branch || 'Abia State HQ'}</p>
                                </div>

                                <div className="p-3 rounded-xl bg-primary/5 text-[10px] border border-primary/10">
                                    <p className="text-primary/60 mb-1 uppercase tracking-widest font-black">Digital Association</p>
                                    {linkedUser ? (
                                        <span className="text-emerald-700 flex items-center font-black uppercase">
                                            <UserCheck className="h-3 w-3 mr-1" /> {linkedUser.full_name}
                                        </span>
                                    ) : (
                                        <span className="text-amber-700 flex items-center font-black uppercase">
                                            <ShieldAlert className="h-3 w-3 mr-1" /> No linked user
                                        </span>
                                    )}
                                </div>
                            </div>

                            <Button 
                                variant="default" 
                                size="sm" 
                                className="w-full shadow-md shadow-primary/20 font-black uppercase tracking-widest text-[10px] h-11"
                                onClick={() => {
                                    setSelectedOfficer(item);
                                    setIsLinkDialogOpen(true);
                                }}
                            >
                                <Link2 className="h-4 w-4 mr-2" />
                                {linkedUser ? "Modify Association" : "Establish Link"}
                            </Button>
                        </div>
                    );
                }}
            />

            <StaffLinkDialog
                officer={selectedOfficer}
                isOpen={isLinkDialogOpen}
                onClose={() => setIsLinkDialogOpen(false)}
                onSuccess={loadData}
            />
        </div>
    );
}
