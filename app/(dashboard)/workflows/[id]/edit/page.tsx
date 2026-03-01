import React from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Play, Save } from 'lucide-react'
import { FlowEditor } from '@/components/workflow/FlowEditor'
import { ThemeSwitcher } from '@/components/theme-switcher'

export default async function WorkflowEditorPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    let dynamicOptions = {
        providers: [] as { id: string; label: string }[],
        secrets: [] as { id: string; label: string }[],
        workflows: [] as { id: string; label: string }[],
        applications: [] as { id: string; label: string }[],
    }

    let workflow = null
    try {
        const payload = await getPayload({ config })
        const [providersRes, secretsRes, workflowsRes, appsRes] = await Promise.all([
            payload.find({ collection: 'service-providers', limit: 100 }),
            payload.find({ collection: 'secrets', limit: 100 }),
            payload.find({ collection: 'workflows', limit: 100 }),
            payload.find({ collection: 'product-types', limit: 100 }),
        ])

        dynamicOptions.providers = providersRes.docs.map(d => ({ id: String(d.id), label: d.name }))
        // For secrets we mask/hide encryptedValue, but id and name are always public 
        dynamicOptions.secrets = secretsRes.docs.map(d => ({ id: String(d.id), label: d.name }))
        dynamicOptions.workflows = workflowsRes.docs.map(d => ({ id: String(d.id), label: d.name }))
        dynamicOptions.applications = appsRes.docs.map(d => ({ id: String(d.slug), label: d.name }))

        if (id !== 'new') {
            workflow = await payload.findByID({
                collection: 'workflows',
                id,
            }).catch(() => null)

            if (!workflow) {
                notFound()
            }
            // Need to pass workflow definition into FlowEditor if loading an existing one
        }
    } catch (e) {
        console.error('Failed to fetch dynamic options for editor', e)
    }

    return (
        <div className="fixed inset-0 z-[100] flex flex-col bg-muted/40 animate-in fade-in duration-200">
            <header className="h-14 bg-background border-b flex items-center justify-between px-4 shrink-0">
                <div className="flex items-center gap-4">
                    <Link href="/workflows" className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground">
                        <ArrowLeft size={18} />
                    </Link>
                    <div className="h-4 w-px bg-border my-auto" />
                    <div className="flex items-center gap-2">
                        <div className="font-semibold text-sm">
                            {id === 'new' ? 'Create New Workflow' : `Editing workflow: ${id}`}
                        </div>
                        <div className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 text-[10px] font-medium uppercase tracking-wider">
                            Draft
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <ThemeSwitcher />
                    <button className="h-8 px-3 text-xs bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-md font-medium transition-colors flex items-center gap-2">
                        <Play size={14} /> Test Run
                    </button>
                    <button className="h-8 px-3 text-xs bg-primary text-primary-foreground hover:bg-primary/90 rounded-md font-medium transition-colors flex items-center gap-2 shadow-sm">
                        <Save size={14} /> Save Draft
                    </button>
                    <button className="h-8 px-3 text-xs bg-green-600 text-white hover:bg-green-700 rounded-md font-medium transition-colors shadow-sm ml-2">
                        Publish
                    </button>
                </div>
            </header>

            <div className="flex-1 w-full relative min-h-0 overflow-hidden">
                <FlowEditor dynamicOptions={dynamicOptions} workflowId={id !== 'new' ? id : undefined} initialData={workflow?.definition as any} />
            </div>
        </div>
    )
}
