import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const secret = searchParams.get('secret')
    const slug = searchParams.get('slug')
    const collection = searchParams.get('collection') || 'pages'

    // Validate the secret to ensure only authorized users can trigger draft mode
    if (secret !== process.env.PAYLOAD_SECRET || !slug) {
        return new Response('Invalid token', { status: 401 })
    }

    const payload = await getPayload({ config: configPromise })

    // Validate that the document exists in draft mode
    const { docs } = await payload.find({
        collection: collection as 'pages' | 'posts',
        where: { slug: { equals: slug } },
        draft: true,
        limit: 1,
        overrideAccess: true,
    })

    if (!docs[0]) {
        return new Response(`Document not found in collection "${collection}"`, { status: 404 })
    }

    const resolvedDraftMode = await draftMode()
    resolvedDraftMode.enable()

    // Redirect to the appropriate public-facing URL
    if (collection === 'posts') {
        redirect(`/blog/${slug}`)
    }
    redirect(`/${slug}`)
}
