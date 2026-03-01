import { getPayload } from 'payload'
import config from '@payload-config'
import { BlogPostForm } from '../_components/BlogPostForm'
import { createBlogPost } from '../actions'

export default async function CreateBlogPostPage() {
    const payload = await getPayload({ config })

    // Fetch categories and authors for the selects
    const [categoriesRes, usersRes] = await Promise.all([
        payload.find({ collection: 'categories', limit: 100 }),
        payload.find({ collection: 'users', limit: 100 }),
    ])

    const categories = categoriesRes.docs.map(c => ({ id: String(c.id), title: c.title }))
    const authors = usersRes.docs.map(u => ({ id: String(u.id), name: u.name || u.email }))

    // Server action for uploading an image to the Payload Media collection
    async function handleImageUpload(formData: FormData) {
        'use server'
        const file = formData.get('file') as File
        if (!file) return null

        try {
            // In a real Payload scenario, we'd use payload.create({ collection: 'media', data: {}, file: { ... } })
            // Due to FormData/File complexities in RSC, we'll mock this for the UI, or you can implement a dedicated API route.
            return { id: 'temp-id', url: URL.createObjectURL(file) }
        } catch (e) {
            console.error(e)
            return null
        }
    }

    return (
        <div className="p-4 sm:p-8">
            <BlogPostForm
                categories={categories}
                authors={authors}
                onSubmit={createBlogPost}
                onImageUpload={async (file) => {
                    // For the UI to work immediately without complex multipart parsing, we use a placeholder or API route
                    // Normally you'd POST this to `/api/media` handled by Payload
                    const formData = new FormData()
                    formData.append('file', file)
                    const res = await fetch('/api/media', { method: 'POST', body: formData })
                    if (res.ok) {
                        const data = await res.json()
                        return { id: data.doc.id, url: data.doc.url }
                    }
                    return null
                }}
            />
        </div>
    )
}
