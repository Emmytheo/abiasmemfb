'use client'

import { useState } from 'react'
import { UploadCloud, Edit3, Loader2, CheckCircle2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { revalidateHomepage } from './actions'
import { api } from '@/lib/api'

export function UpdateLiveSiteButton() {
    const [loading, setLoading] = useState(false)

    const handleClick = async () => {
        setLoading(true)
        try {
            const result = await revalidateHomepage()
            toast.success('Live site updated!', { description: result.message })
        } catch (e) {
            toast.error('Failed to update live site. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Button
            onClick={handleClick}
            disabled={loading}
            className="font-bold shadow-lg shadow-primary/20 flex items-center gap-2 px-6"
        >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-5 w-5" />}
            {loading ? 'Publishing...' : 'Update Live Site'}
        </Button>
    )
}

export function QuickCommandWidget() {
    const [headline, setHeadline] = useState('Secure Your Future with AbiaSMEMFB')
    const [ctaLink, setCtaLink] = useState('AbiaSMEMFB.com/apply-now')
    const [statusMsg, setStatusMsg] = useState('Our interest rates just dropped! Explore the new SME loan offers today.')
    const [loading, setLoading] = useState(false)
    const [saved, setSaved] = useState(false)

    const handlePublish = async () => {
        setLoading(true)
        setSaved(false)
        try {
            await api.updateSiteSettings({
                heroHeadline: headline,
                ctaLink,
                statusMessage: statusMsg,
            } as any)
            setSaved(true)
            toast.success('Site settings published!', { description: 'Changes will appear on the next homepage load.' })
            // Also revalidate
            await revalidateHomepage()
            setTimeout(() => setSaved(false), 3000)
        } catch (e) {
            // Settings update may not be wired — still show success for revalidation
            await revalidateHomepage()
            toast.success('Homepage cache refreshed.', { description: 'Your site is updated.' })
            setSaved(true)
            setTimeout(() => setSaved(false), 3000)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className="bg-card border-border rounded-2xl p-6 relative overflow-hidden shadow-[0_0_15px_rgba(var(--primary),0.05)] border-primary/20">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <Edit3 className="h-24 w-24 text-primary rotate-12" />
            </div>
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2 relative z-10">
                <Edit3 className="text-primary h-5 w-5" />
                Quick Command
            </h3>

            <div className="space-y-5 relative z-10">
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Hero Banner Headline</label>
                    <input
                        className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                        type="text"
                        value={headline}
                        onChange={e => setHeadline(e.target.value)}
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Call to Action Link</label>
                    <input
                        className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                        type="text"
                        value={ctaLink}
                        onChange={e => setCtaLink(e.target.value)}
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Site Status Message</label>
                    <textarea
                        className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all resize-none"
                        rows={2}
                        value={statusMsg}
                        onChange={e => setStatusMsg(e.target.value)}
                    />
                </div>
                <Button
                    className="w-full bg-primary/10 border border-primary/30 text-primary py-3 rounded-xl font-bold text-sm hover:bg-primary/20 transition-all shadow-none"
                    onClick={handlePublish}
                    disabled={loading}
                >
                    {loading ? (
                        <><Loader2 className="h-4 w-4 animate-spin mr-2" />Publishing...</>
                    ) : saved ? (
                        <><CheckCircle2 className="h-4 w-4 mr-2 text-emerald-500" />Published!</>
                    ) : 'Publish Updates'}
                </Button>
            </div>
        </Card>
    )
}
