import { getPayload } from 'payload'
import config from '@payload-config'
import { notFound } from 'next/navigation'
import { BlogPostForm } from '../../_components/BlogPostForm'
import { updateBlogPost } from '../../actions'

export default async function EditBlogPostPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const payload = await getPayload({ config })

    // Fetch categories and authors for the selects
    const [categoriesRes, usersRes] = await Promise.all([
        payload.find({ collection: 'categories', limit: 100 }),
        payload.find({ collection: 'users', limit: 100 }),
    ])

    const categories = categoriesRes.docs.map(c => ({ id: String(c.id), title: c.title }))
    const authors = usersRes.docs.map(u => ({ id: String(u.id), name: u.name || u.email }))

    // Fetch the target post
    const post = await payload.findByID({
        collection: 'posts',
        id,
    }).catch(() => null)

    if (!post) {
        notFound()
    }

    const initialData = {
        id: post.id,
        title: post.title,
        slug: post.slug as string,
        excerpt: post.excerpt as string,
        status: post._status as 'draft' | 'published',
        categoryId: typeof post.category === 'object' ? post.category?.id : String(post.category || ''),
        authorId: typeof post.author === 'object' ? post.author?.id : String(post.author || ''),
        featuredImageId: typeof post.featuredImage === 'object' ? post.featuredImage?.id : String(post.featuredImage || ''),
        featuredImageUrl: typeof post.featuredImage === 'object' && post.featuredImage ? post.featuredImage.url : '',
        content: post.content,
    }

    return (
        <div className="p-4 sm:p-8">
            <BlogPostForm
                initialData={initialData}
                categories={categories}
                authors={authors}
                onSubmit={updateBlogPost.bind(null, id)}
                onImageUpload={async (file) => {
                    'use server'
                    // For the UI to work immediately without complex multipart parsing, we use a placeholder or API route
                    const formData = new FormData()
                    formData.append('file', file)
                    const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/media`, { method: 'POST', body: formData })
                    if (res.ok) {
                        const data = await res.json()
                        return { id: data.doc.id, url: data.doc.url } // Requires an API route at /api/media mapping to payload.create
                    }
                    return null
                }}
            />
        </div>
    )
}
