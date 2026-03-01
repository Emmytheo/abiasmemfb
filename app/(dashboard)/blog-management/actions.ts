'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { revalidatePath } from 'next/cache'

export async function createBlogPost(data: any) {
    try {
        const payload = await getPayload({ config })

        let contentInput = data.content
        if (typeof contentInput === 'string' && contentInput.trim() !== '') {
            contentInput = {
                root: {
                    type: 'root',
                    format: '',
                    indent: 0,
                    version: 1,
                    children: [
                        {
                            type: 'paragraph',
                            format: '',
                            indent: 0,
                            version: 1,
                            children: [
                                {
                                    detail: 0,
                                    format: 0,
                                    mode: 'normal',
                                    style: '',
                                    text: contentInput,
                                    type: 'text',
                                    version: 1,
                                }
                            ]
                        }
                    ]
                }
            }
        } else if (!contentInput) {
            contentInput = {
                root: {
                    type: 'root',
                    format: '',
                    indent: 0,
                    version: 1,
                    children: [
                        {
                            type: 'paragraph',
                            format: '',
                            indent: 0,
                            version: 1,
                            children: []
                        }
                    ]
                }
            }
        }

        const post = await payload.create({
            collection: 'posts',
            data: {
                title: data.title,
                slug: data.slug,
                excerpt: data.excerpt,
                content: contentInput,
                _status: data.status,
                category: data.categoryId || null,
                author: data.authorId || null,
                featuredImage: data.featuredImageId || null,
            },
        })

        revalidatePath('/blog-management')
        return { success: true, id: post.id }
    } catch (error: any) {
        console.error('Failed to create blog post:', error)
        return { success: false, error: error.message || 'Failed to create blog post' }
    }
}

export async function updateBlogPost(id: string, data: any) {
    try {
        const payload = await getPayload({ config })

        let contentInput = data.content
        if (typeof contentInput === 'string' && contentInput.trim() !== '') {
            contentInput = {
                root: {
                    type: 'root',
                    format: '',
                    indent: 0,
                    version: 1,
                    children: [
                        {
                            type: 'paragraph',
                            format: '',
                            indent: 0,
                            version: 1,
                            children: [
                                {
                                    detail: 0,
                                    format: 0,
                                    mode: 'normal',
                                    style: '',
                                    text: contentInput,
                                    type: 'text',
                                    version: 1,
                                }
                            ]
                        }
                    ]
                }
            }
        }

        const updateData: any = {
            title: data.title,
            slug: data.slug,
            excerpt: data.excerpt,
            _status: data.status,
            category: data.categoryId || null,
            author: data.authorId || null,
            featuredImage: data.featuredImageId || null,
        }

        if (contentInput) {
            updateData.content = contentInput
        }

        const post = await payload.update({
            collection: 'posts',
            id,
            data: updateData,
        })

        revalidatePath('/blog-management')
        revalidatePath(`/blog-management/${id}/edit`)
        return { success: true, id: post.id }
    } catch (error: any) {
        console.error('Failed to update blog post:', error)
        return { success: false, error: error.message || 'Failed to update blog post' }
    }
}

export async function deleteBlogPost(id: string) {
    try {
        const payload = await getPayload({ config })

        await payload.delete({
            collection: 'posts',
            id,
        })

        revalidatePath('/blog-management')
        return { success: true }
    } catch (error: any) {
        console.error('Failed to delete blog post:', error)
        return { success: false, error: error.message || 'Failed to delete blog post' }
    }
}
