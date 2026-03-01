import { DashboardSidebar } from '@/components/dashboard-sidebar'
import { ApplicationsView } from '@/components/payload/views/ApplicationsView'
import { S3ClientUploadHandler } from '@payloadcms/storage-s3/client'
import { CollectionCards } from '@payloadcms/next/rsc'
import {
    MetaTitleComponent,
    MetaDescriptionComponent,
    MetaImageComponent,
    OverviewComponent,
    PreviewComponent,
} from '@payloadcms/plugin-seo/client'
import { RscEntryLexicalCell, RscEntryLexicalField } from '@payloadcms/richtext-lexical/rsc'

export const importMap = {
    '@/components/dashboard-sidebar#DashboardSidebar': DashboardSidebar,
    '@/components/payload/views/ApplicationsView#ApplicationsView': ApplicationsView,
    '@payloadcms/storage-s3/client#S3ClientUploadHandler': S3ClientUploadHandler,
    '@payloadcms/next/rsc#CollectionCards': CollectionCards,
    '@payloadcms/plugin-seo/client#OverviewComponent': OverviewComponent,
    '@payloadcms/plugin-seo/client#MetaTitleComponent': MetaTitleComponent,
    '@payloadcms/plugin-seo/client#MetaDescriptionComponent': MetaDescriptionComponent,
    '@payloadcms/plugin-seo/client#MetaImageComponent': MetaImageComponent,
    '@payloadcms/plugin-seo/client#PreviewComponent': PreviewComponent,
    '@payloadcms/richtext-lexical/rsc#RscEntryLexicalCell': RscEntryLexicalCell,
    '@payloadcms/richtext-lexical/rsc#RscEntryLexicalField': RscEntryLexicalField,
}
