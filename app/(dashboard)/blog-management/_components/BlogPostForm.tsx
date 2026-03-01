'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { toast } from "sonner"
import { Loader2, ArrowLeft, Image as ImageIcon, X } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

import { Switch } from "@/components/ui/switch"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

export const blogPostSchema = z.object({
    title: z.string().min(3, "Title must be at least 3 characters").max(100, "Title is too long"),
    slug: z.string().min(3, "Slug is required").regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
    excerpt: z.string().optional(),
    content: z.any().optional(), // Lexical editor state
    status: z.enum(["draft", "published"]),
    categoryId: z.string().optional(),
    authorId: z.string().optional(),
    featuredImageId: z.string().optional(),
})

export type BlogPostFormValues = z.infer<typeof blogPostSchema>

export interface CategoryOption {
    id: string;
    title: string;
}

export interface AuthorOption {
    id: string;
    name: string;
}

interface BlogPostFormProps {
    initialData?: Partial<BlogPostFormValues> & { id?: string | number, featuredImageUrl?: string };
    categories: CategoryOption[];
    authors: AuthorOption[];
    onSubmit: (data: BlogPostFormValues) => Promise<{ success: boolean; error?: string; id?: string | number }>;
    onImageUpload: (file: File) => Promise<{ id: string; url: string } | null>;
}

export function BlogPostForm({
    initialData,
    categories,
    authors,
    onSubmit,
    onImageUpload
}: BlogPostFormProps) {
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [imagePreview, setImagePreview] = useState<string | null>(initialData?.featuredImageUrl || null)
    const [isUploadingImage, setIsUploadingImage] = useState(false)

    const form = useForm<BlogPostFormValues>({
        resolver: zodResolver(blogPostSchema),
        defaultValues: {
            title: initialData?.title || '',
            slug: initialData?.slug || '',
            excerpt: initialData?.excerpt || '',
            status: initialData?.status || 'draft',
            categoryId: initialData?.categoryId || '',
            authorId: initialData?.authorId || '',
            featuredImageId: initialData?.featuredImageId || '',
            content: initialData?.content,
        },
    })

    // Auto-generate slug from title if slug is empty
    const watchTitle = form.watch("title")
    useEffect(() => {
        if (!initialData?.id && watchTitle) {
            const generatedSlug = watchTitle
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)+/g, '');
            form.setValue('slug', generatedSlug, { shouldValidate: true })
        }
    }, [watchTitle, initialData?.id, form])

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (file.size > 5 * 1024 * 1024) {
            toast.error("Image must be smaller than 5MB")
            return
        }

        setIsUploadingImage(true)
        try {
            const result = await onImageUpload(file)
            if (result) {
                form.setValue('featuredImageId', result.id)
                setImagePreview(result.url)
                toast.success("Image uploaded successfully")
            } else {
                toast.error("Failed to upload image")
            }
        } catch (error) {
            console.error("Upload error:", error)
            toast.error("An error occurred during upload")
        } finally {
            setIsUploadingImage(false)
        }
    }

    const removeImage = () => {
        form.setValue('featuredImageId', '')
        setImagePreview(null)
    }

    const handleSubmit = async (data: BlogPostFormValues) => {
        setIsSubmitting(true)
        try {
            const result = await onSubmit(data)

            if (result.success) {
                toast.success(initialData?.id ? 'Post updated successfully' : 'Post created successfully')
                router.push('/blog-management')
                router.refresh()
            } else {
                toast.error(result.error || 'Something went wrong')
            }
        } catch (error: any) {
            toast.error(error.message || 'An unexpected error occurred')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto pb-20">
                {/* Header Actions */}
                <div className="flex items-center justify-between bg-card p-4 rounded-xl border shadow-sm sticky top-4 z-40">
                    <div className="flex items-center gap-4">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-foreground"
                            onClick={() => router.push('/blog-management')}
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back
                        </Button>
                        <div className="h-4 w-px bg-border my-auto" />
                        <h1 className="font-semibold text-sm">
                            {initialData?.id ? 'Edit Post' : 'Create New Post'}
                        </h1>
                    </div>

                    <div className="flex items-center gap-3">
                        <FormField
                            control={form.control}
                            name="status"
                            render={({ field }) => (
                                <FormItem className="flex items-center gap-2 space-y-0 mr-4">
                                    <FormControl>
                                        <Switch
                                            checked={field.value === 'published'}
                                            onCheckedChange={(checked) => field.onChange(checked ? 'published' : 'draft')}
                                        />
                                    </FormControl>
                                    <FormLabel className="text-xs font-medium uppercase tracking-wider cursor-pointer m-0">
                                        {field.value === 'published' ? (
                                            <span className="text-emerald-600 dark:text-emerald-500">Published</span>
                                        ) : (
                                            <span className="text-amber-600 dark:text-amber-500">Draft</span>
                                        )}
                                    </FormLabel>
                                </FormItem>
                            )}
                        />
                        <Button type="submit" disabled={isSubmitting} className="shadow-lg shadow-primary/20">
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                initialData?.id ? 'Update Post' : 'Publish Post'
                            )}
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content Area */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-card border rounded-2xl p-6 shadow-sm space-y-6">
                            <FormField
                                control={form.control}
                                name="title"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Post Title</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter a descriptive title..." className="text-lg bg-background" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="excerpt"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Summary Excerpt</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="A brief summary for previews and SEO..."
                                                className="resize-none bg-background min-h-[100px]"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="bg-card border rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[500px]">
                            <div className="p-4 border-b bg-muted/30">
                                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Post Content</span>
                            </div>

                            {/* NOTE: During the implementation phase, the Lexical Editor requires complex Payload integration. 
                                For this MVP Dashboard view, we map it to a standard textarea, or you can integrate the Payload Lexical component if exposed. */}
                            <FormField
                                control={form.control}
                                name="content"
                                render={({ field }) => (
                                    <FormItem className="flex-1 flex flex-col p-4 w-full h-full gap-2">
                                        <p className="text-xs text-amber-600 bg-amber-500/10 p-2 rounded border border-amber-500/20">
                                            Note: The dashboard currently provides a plain-text fall-back editor for the Post Content. Full Lexical RichText editing is available via the unified Admin console at `/admin/collections/posts`.
                                        </p>
                                        <FormControl className="flex-1 h-full">
                                            <Textarea
                                                placeholder="Write your post content here (Supports HTML/Markdown)..."
                                                className="flex-1 resize-y bg-background font-mono text-sm leading-relaxed p-4 min-h-[400px] shadow-inner focus-visible:ring-1"
                                                value={typeof field.value === 'string' ? field.value : JSON.stringify(field.value, null, 2) || ''}
                                                onChange={(e) => {
                                                    try {
                                                        const parsed = JSON.parse(e.target.value);
                                                        field.onChange(parsed);
                                                    } catch {
                                                        field.onChange(e.target.value);
                                                    }
                                                }}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>

                    {/* Sidebar Configuration */}
                    <div className="space-y-6">
                        {/* URL Slug */}
                        <div className="bg-card border rounded-2xl p-6 shadow-sm space-y-4">
                            <FormField
                                control={form.control}
                                name="slug"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                            URL Slug
                                        </FormLabel>
                                        <FormControl>
                                            <Input placeholder="my-post-url" className="bg-background font-mono text-xs" {...field} />
                                        </FormControl>
                                        <FormDescription className="text-[10px]">
                                            Must be unique and URL-safe.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Taxonomy */}
                        <div className="bg-card border rounded-2xl p-6 shadow-sm space-y-6">
                            <FormField
                                control={form.control}
                                name="categoryId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Category</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value || undefined}>
                                            <FormControl>
                                                <SelectTrigger className="bg-background">
                                                    <SelectValue placeholder="Select a category" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {categories.map((c) => (
                                                    <SelectItem key={c.id} value={c.id}>
                                                        {c.title}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="authorId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Author</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value || undefined}>
                                            <FormControl>
                                                <SelectTrigger className="bg-background">
                                                    <SelectValue placeholder="Select an author" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {authors.map((a) => (
                                                    <SelectItem key={a.id} value={a.id}>
                                                        {a.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Featured Image */}
                        <div className="bg-card border rounded-2xl p-6 shadow-sm space-y-4">
                            <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground block mb-2">Featured Image</FormLabel>

                            {imagePreview ? (
                                <div className="relative rounded-xl overflow-hidden border group bg-muted/30 aspect-video">
                                    <Image
                                        src={imagePreview}
                                        alt="Featured preview"
                                        fill
                                        className="object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="sm"
                                            onClick={removeImage}
                                            className="shadow-xl"
                                        >
                                            <X className="h-4 w-4 mr-2" />
                                            Remove Cover
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-3 text-center bg-muted/20 hover:bg-muted/40 transition-colors">
                                    <div className="p-3 bg-secondary/50 rounded-full text-muted-foreground">
                                        <ImageIcon className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">Upload Cover Image</p>
                                        <p className="text-xs text-muted-foreground mt-1">JPEG, PNG, WebP up to 5MB</p>
                                    </div>
                                    <Input
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        className="h-full w-full absolute inset-0 opacity-0 cursor-pointer"
                                        onChange={handleImageChange}
                                        disabled={isUploadingImage}
                                    />
                                </div>
                            )}
                            {isUploadingImage && (
                                <div className="text-xs text-muted-foreground flex items-center gap-2 justify-center">
                                    <Loader2 className="h-3 w-3 animate-spin" /> Uploading image...
                                </div>
                            )}

                            <FormField
                                control={form.control}
                                name="featuredImageId"
                                render={({ field }) => (
                                    <FormItem className="hidden">
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>
                </div>
            </form>
        </Form>
    )
}
