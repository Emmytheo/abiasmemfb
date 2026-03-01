"use server";

import { api } from "@/lib/api";
import Link from "next/link";
import { ExternalLink, Settings2 } from "lucide-react";

export async function GlobalContentTable() {
    let configs: any[] = [];
    let error: string | null = null;

    try {
        configs = await api.getConfigsByCategory("Global Content");
    } catch (e: any) {
        error = e?.message || "Failed to load global content";
    }

    if (error) {
        return (
            <div className="bg-destructive/5 border border-destructive/20 rounded-2xl p-8 text-center">
                <Settings2 className="h-10 w-10 text-destructive/50 mx-auto mb-3" />
                <p className="font-semibold text-destructive">Could not load global content</p>
                <p className="text-sm text-muted-foreground mt-1">{error}</p>
            </div>
        );
    }

    if (configs.length === 0) {
        return (
            <div className="bg-card border border-border rounded-2xl p-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                    <Settings2 className="h-8 w-8 text-muted-foreground/40" />
                </div>
                <h3 className="text-lg font-bold mb-2">No global config entries</h3>
                <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
                    Use the Payload CMS admin to create global config entries under the "Global Content" category.
                </p>
                <Link
                    href="/admin/globals"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold text-sm shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
                >
                    Go to CMS Globals
                </Link>
            </div>
        );
    }

    return (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            <div className="px-6 py-5 border-b border-border flex items-center justify-between bg-muted/10">
                <div>
                    <h2 className="text-lg font-bold">Site Configuration</h2>
                    <p className="text-sm text-muted-foreground">{configs.length} config{configs.length !== 1 ? "s" : ""} loaded</p>
                </div>
                <Link
                    href="/admin/globals"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                >
                    Edit all in CMS <ExternalLink className="h-3 w-3" />
                </Link>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-border bg-muted/20">
                            <th className="px-6 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Config Key</th>
                            <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Value Preview</th>
                            <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground hidden sm:table-cell">Last Updated</th>
                            <th className="px-4 py-3.5 text-right text-xs font-bold uppercase tracking-wider text-muted-foreground">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {configs.map((cfg) => (
                            <tr key={cfg.id} className="hover:bg-muted/20 transition-colors group">
                                <td className="px-6 py-4">
                                    <span className="font-mono text-xs bg-muted/60 px-2.5 py-1 rounded-md text-foreground font-bold">
                                        {cfg.key}
                                    </span>
                                </td>
                                <td className="px-4 py-4">
                                    <p className="text-muted-foreground text-sm max-w-[300px] truncate">{cfg.value}</p>
                                </td>
                                <td className="px-4 py-4 text-muted-foreground text-sm hidden sm:table-cell">
                                    {new Date(cfg.updated_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                                </td>
                                <td className="px-4 py-4">
                                    <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                        <Link
                                            href="/admin/globals"
                                            className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                                            title="Edit in CMS"
                                        >
                                            <Settings2 className="h-4 w-4" />
                                        </Link>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
