import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { fileURLToPath } from 'url'
import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Pages } from './collections/Pages'
import { Categories } from './collections/Categories'
import { Tags } from './collections/Tags'
import { Posts } from './collections/Posts'
import { SiteSettings } from './collections/SiteSettings'
import { ProductTypes } from './collections/ProductTypes'
import { ProductClasses } from './collections/ProductClasses'
import { ProductCategories } from './collections/ProductCategories'
import { ProductApplications } from './collections/ProductApplications'
// Workflow Engine collections
import { Workflows } from './collections/Workflows'
import { WorkflowExecutions } from './collections/WorkflowExecutions'
import { ServiceProviders } from './collections/ServiceProviders'
import { Secrets } from './collections/Secrets'
import { ProviderHealthLogs } from './collections/ProviderHealthLogs'
import { ScheduledJobs } from './collections/ScheduledJobs'
import { CustomBlocks } from './collections/CustomBlocks'
import { IdempotencyRecords } from './collections/IdempotencyRecords'
// Digital Ledger collections
import { Accounts } from './collections/Accounts'
import { Loans } from './collections/Loans'
import { Transactions } from './collections/Transactions'
import { s3Storage } from '@payloadcms/storage-s3'
import { seoPlugin } from '@payloadcms/plugin-seo'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
    admin: {
        user: Users.slug,
        importMap: {
            baseDir: path.resolve(dirname),
        },
        components: {
            views: {
                ApplicationsView: {
                    Component: '@/components/payload/views/ApplicationsView#ApplicationsView',
                    path: '/applications',
                    exact: true,
                },
                WorkflowEditorView: {
                    Component: '@/components/payload/views/WorkflowEditorView#WorkflowEditorView',
                    path: '/workflow-editor/:workflowId',
                },
                WorkflowRunsView: {
                    Component: '@/components/payload/views/WorkflowRunsView#WorkflowRunsView',
                    path: '/workflow-runs',
                },
            },
        },
        // Live Preview: renders an iframe inside the admin edit view
        livePreview: {
            breakpoints: [
                { label: 'Mobile', name: 'mobile', width: 375, height: 667 },
                { label: 'Tablet', name: 'tablet', width: 768, height: 1024 },
                { label: 'Desktop', name: 'desktop', width: 1440, height: 900 },
            ],
            // Determines which collections get the live preview pane
            collections: ['pages', 'posts'],
            url: ({ data, collectionConfig }) => {
                const baseUrl = process.env.VERCEL_URL
                    ? `https://${process.env.VERCEL_URL}`
                    : 'http://localhost:3000'

                if (collectionConfig?.slug === 'posts') {
                    return `${baseUrl}/blog/${data.slug}`
                }
                // Default: pages
                return `${baseUrl}/${data.slug}`
            },
        },
    },
    collections: [
        // Content & Auth
        Users, Media, Pages, Categories, Tags, Posts,
        // Products
        ProductClasses, ProductCategories, ProductTypes, ProductApplications,
        // Workflow Engine
        Workflows, WorkflowExecutions, ServiceProviders, Secrets,
        ProviderHealthLogs, ScheduledJobs, CustomBlocks, IdempotencyRecords,
        // Digital Ledger
        Accounts, Loans, Transactions,
    ],
    globals: [SiteSettings],
    editor: lexicalEditor({}),
    secret: process.env.PAYLOAD_SECRET || 'secret-key-for-development',
    db: postgresAdapter({
        pool: {
            connectionString: process.env.DATABASE_URI || '',
        },
    }),
    plugins: [
        // SEO Plugin: adds meta title, description, image, and og preview to Pages and Posts
        seoPlugin({
            collections: ['pages', 'posts'],
            uploadsCollection: 'media',
            generateTitle: ({ doc }) =>
                doc?.title ? `${doc.title} | Abia Microfinance Bank` : 'Abia Microfinance Bank',
            generateDescription: ({ doc }) =>
                doc?.excerpt || doc?.description || 'Empowering Your Financial Future',
            generateURL: ({ doc, collectionConfig }) => {
                const baseUrl = process.env.VERCEL_URL
                    ? `https://${process.env.VERCEL_URL}`
                    : 'http://localhost:3000'
                if (collectionConfig?.slug === 'posts') return `${baseUrl}/blog/${doc?.slug}`
                return `${baseUrl}/${doc?.slug}`
            },
        }),
        s3Storage({
            collections: {
                media: {
                    disablePayloadAccessControl: true,
                    generateFileURL: ({ filename, prefix }) => {
                        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
                        const bucket = process.env.NEXT_PUBLIC_SUPABASE_BUCKET_NAME || 'public'
                        const path = prefix ? `${prefix}/${filename}` : filename
                        // Use Supabase public URL format instead of the S3 API path
                        return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`
                    },
                },
            },
            bucket: process.env.NEXT_PUBLIC_SUPABASE_BUCKET_NAME || 'public',
            config: {
                credentials: {
                    accessKeyId: process.env.SUPABASE_S3_ACCESS_KEY || '',
                    secretAccessKey: process.env.SUPABASE_S3_SECRET_KEY || '',
                },
                region: process.env.NEXT_PUBLIC_SUPABASE_REGION || 'us-east-1',
                endpoint: process.env.NEXT_PUBLIC_SUPABASE_URL
                    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/s3`
                    : '',
                forcePathStyle: true,
            },
        }),
    ],
})
