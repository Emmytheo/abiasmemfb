import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { fileURLToPath } from 'url'
import { Users } from './collections/Users.ts'
import { Customers } from './collections/Customers.ts'
import { Media } from './collections/Media.ts'
import { Pages } from './collections/Pages.ts'
import { Categories } from './collections/Categories.ts'
import { Tags } from './collections/Tags.ts'
import { Posts } from './collections/Posts.ts'
import { SiteSettings } from './collections/SiteSettings.ts'
import { ProductTypes } from './collections/ProductTypes.ts'
import { ProductClasses } from './collections/ProductClasses.ts'
import { ProductCategories } from './collections/ProductCategories.ts'
import { ProductApplications } from './collections/ProductApplications.ts'
// Workflow Engine collections
import { Workflows } from './collections/Workflows.ts'
import { WorkflowExecutions } from './collections/WorkflowExecutions.ts'
import { ServiceProviders } from './collections/ServiceProviders.ts'
import { Endpoints } from './collections/Endpoints.ts'
import { ProviderMappings } from './collections/ProviderMappings.ts'
import { Secrets } from './collections/Secrets.ts'
import { ProviderHealthLogs } from './collections/ProviderHealthLogs.ts'
import { ScheduledJobs } from './collections/ScheduledJobs.ts'
import { CustomBlocks } from './collections/CustomBlocks.ts'
import { IdempotencyRecords } from './collections/IdempotencyRecords.ts'
import { ServiceCategories } from './collections/ServiceCategories.ts'
import { Services } from './collections/Services.ts'
// Digital Ledger collections
import { Accounts } from './collections/Accounts.ts'
import { Loans } from './collections/Loans.ts'
import { Transactions } from './collections/Transactions.ts'
import { Beneficiaries } from './collections/Beneficiaries.ts'
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
        Users, Customers, Media, Pages, Categories, Tags, Posts,
        // Products
        ProductClasses, ProductCategories, ProductTypes, ProductApplications,
        // Workflow Engine
        Workflows, WorkflowExecutions, ServiceProviders, Endpoints, ProviderMappings, Secrets,
        ProviderHealthLogs, ScheduledJobs, CustomBlocks, IdempotencyRecords,
        // Service Pipeline
        ServiceCategories, Services,
        // Digital Ledger
        Accounts, Loans, Transactions, Beneficiaries,
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
