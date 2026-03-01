import { notFound } from 'next/navigation'
import { api } from '@/lib/api'
import { PageRenderer } from '@/components/payload/PageRenderer'
import { Suspense } from 'react'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

async function fetchPageDraft(slug: string) {
    try {
        const payload = await getPayload({ config: configPromise })
        const { docs } = await payload.find({
            collection: 'pages',
            where: { slug: { equals: slug } },
            draft: true,
            limit: 1,
            depth: 2,
            overrideAccess: true,
        } as any)
        return docs[0] || null
    } catch {
        return null
    }
}

// Everything dynamic goes here — inside the Suspense child.
// params, draftMode, and db calls must never be awaited in the outer shell.
async function PageContent({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params

    // 1. Try published version first
    let pageData = await api.getPageBySlug(slug)

    // 2. Fallback to draft (for live preview iframe which can't set cookies)
    if (!pageData) {
        pageData = await fetchPageDraft(slug)
    }

    if (!pageData) {
        notFound()
    }

    return <PageRenderer layout={pageData.layout} />
}

// Outer component is synchronous — it only renders the Suspense shell.
export default function DynamicGlobalPage({ params }: { params: Promise<{ slug: string }> }) {
    return (
        <main className="flex flex-col min-h-screen">
            <Suspense fallback={
                <div className="min-h-screen flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-7 h-7 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                        <p className="text-sm text-muted-foreground animate-pulse">Loading...</p>
                    </div>
                </div>
            }>
                <PageContent params={params} />
            </Suspense>
        </main>
    )
}
