import type { CollectionConfig } from 'payload'

/**
 * Cooperatives — Trade guilds, thrift societies, and cooperative groups
 * registered on the Copteller platform. Sector-agnostic: supports transport,
 * agriculture, commerce, artisan, health, education, technology, housing, and more.
 */
export const Cooperatives: CollectionConfig = {
    slug: 'cooperatives',
    admin: {
        useAsTitle: 'name',
        group: 'Copteller',
        defaultColumns: ['name', 'cooperative_type', 'sector', 'state', 'status', 'createdAt'],
        description: 'Cooperative groups and trade guilds managed on the Copteller platform.',
    },
    access: {
        read: () => true,
        create: ({ req }) => req.user?.role === 'admin',
        update: ({ req }) => req.user?.role === 'admin',
        delete: ({ req }) => req.user?.role === 'admin',
    },
    fields: [
        {
            name: 'name',
            type: 'text',
            required: true,
            unique: true,
            admin: { description: 'Official name of the cooperative (e.g. "Aba Tricycle Operators Guild").' },
        },
        {
            name: 'description',
            type: 'textarea',
        },
        {
            name: 'union_leader',
            type: 'relationship',
            relationTo: 'customers',
            required: true,
            admin: { description: 'The registered customer serving as the primary cooperative admin / union leader.' },
        },
        // ── Classification ────────────────────────────────────────────────────
        {
            type: 'row',
            fields: [
                {
                    name: 'cooperative_type',
                    type: 'select',
                    required: true,
                    defaultValue: 'multipurpose',
                    options: [
                        { label: 'Thrift & Credit Society', value: 'thrift_credit' },
                        { label: 'Multipurpose Cooperative', value: 'multipurpose' },
                        { label: 'Agricultural Cooperative', value: 'agricultural' },
                        { label: 'Transport / Fleet Cooperative', value: 'transport' },
                        { label: 'Trade & Commerce Union', value: 'trade' },
                        { label: 'Professional Cooperative', value: 'professional' },
                        { label: 'Housing Cooperative', value: 'housing' },
                        { label: 'Consumer Cooperative', value: 'consumer' },
                        { label: 'Women\'s Cooperative', value: 'women' },
                        { label: 'Youth Cooperative', value: 'youth' },
                        { label: 'Other', value: 'other' },
                    ],
                },
                {
                    name: 'sector',
                    type: 'select',
                    required: true,
                    defaultValue: 'commerce',
                    options: [
                        { label: 'Transport / Logistics', value: 'transport' },
                        { label: 'Agriculture / Agro-Allied', value: 'agriculture' },
                        { label: 'Commerce / Market Trade', value: 'commerce' },
                        { label: 'Artisan / Craft Workers', value: 'artisan' },
                        { label: 'Health & Wellness', value: 'health' },
                        { label: 'Education Workers', value: 'education' },
                        { label: 'Technology / Digital', value: 'technology' },
                        { label: 'Professional Services', value: 'professional' },
                        { label: 'Housing / Real Estate', value: 'housing' },
                        { label: 'Manufacturing / Production', value: 'manufacturing' },
                        { label: 'Energy / Utilities', value: 'energy' },
                        { label: 'Financial Services', value: 'financial_services' },
                        { label: 'Other', value: 'other' },
                    ],
                },
            ],
        },
        {
            name: 'segment',
            type: 'text',
            admin: { description: 'Specific segment within the sector (e.g. "Keke Operators", "Crop Farmers", "Garment Makers"). Free text for precision.' },
        },
        // ── Registration & Location ────────────────────────────────────────────
        {
            type: 'collapsible',
            label: 'Registration & Location',
            fields: [
                {
                    name: 'registration_number',
                    type: 'text',
                    admin: { description: 'CAC or Cooperative Society registration number (e.g. RC123456).' },
                },
                {
                    type: 'row',
                    fields: [
                        {
                            name: 'state',
                            type: 'text',
                            admin: { description: 'Nigerian state where the cooperative operates (e.g. "Abia").' },
                        },
                        {
                            name: 'lga',
                            type: 'text',
                            admin: { description: 'Local Government Area (e.g. "Aba North").' },
                        },
                    ],
                },
                {
                    name: 'address',
                    type: 'text',
                    admin: { description: 'Physical office or meeting address of the cooperative.' },
                },
            ],
        },
        // ── Status & Governance ────────────────────────────────────────────────
        {
            type: 'row',
            fields: [
                {
                    name: 'status',
                    type: 'select',
                    required: true,
                    defaultValue: 'pending',
                    options: [
                        { label: 'Pending Bank Approval', value: 'pending' },
                        { label: 'Active', value: 'active' },
                        { label: 'Suspended', value: 'suspended' },
                        { label: 'Closed / Dissolved', value: 'closed' },
                    ],
                },
                {
                    name: 'bank_approval_date',
                    type: 'date',
                    admin: { description: 'Date the bank superadmin approved this cooperative.' },
                },
            ],
        },
        // ── Membership Capacity ────────────────────────────────────────────────
        {
            type: 'row',
            fields: [
                {
                    name: 'max_members',
                    type: 'number',
                    admin: { description: 'Maximum number of members this cooperative can accommodate.' },
                },
                {
                    name: 'current_member_count',
                    type: 'number',
                    defaultValue: 0,
                    admin: { description: 'Current active member count. Updated automatically via CoptellerMemberships hooks.' },
                },
            ],
        },
        // ── Authorized Product Types ───────────────────────────────────────────
        {
            name: 'authorized_product_types',
            type: 'relationship',
            relationTo: 'product-types',
            hasMany: true,
            admin: { description: 'Product types this cooperative is authorized to offer to its members.' },
        },
        // ── Financial Configuration ────────────────────────────────────────────
        {
            type: 'collapsible',
            label: 'Financial Configuration',
            fields: [
                {
                    type: 'row',
                    fields: [
                        {
                            name: 'escrowFeePercent',
                            type: 'number',
                            defaultValue: 1.5,
                            admin: { description: 'Platform escrow clearing fee (%). Overrides the platform default from env.' },
                        },
                        {
                            name: 'investorYieldSplitPercent',
                            type: 'number',
                            defaultValue: 80,
                            admin: { description: 'Percentage of yield paid to investors (%). Remainder splits between cooperative and bank.' },
                        },
                    ],
                },
                {
                    type: 'row',
                    fields: [
                        {
                            name: 'defaultContributionAmount',
                            type: 'number',
                            defaultValue: 1000000,
                            admin: { description: 'Default Ajo contribution amount in Kobo (e.g. 1,000,000 = ₦10,000).' },
                        },
                        {
                            name: 'cycleFrequency',
                            type: 'select',
                            defaultValue: 'weekly',
                            options: [
                                { label: 'Daily', value: 'daily' },
                                { label: 'Weekly', value: 'weekly' },
                                { label: 'Bi-Weekly', value: 'biweekly' },
                                { label: 'Monthly', value: 'monthly' },
                            ],
                        },
                    ],
                },
                {
                    name: 'marketplaceEnabled',
                    type: 'checkbox',
                    defaultValue: false,
                    admin: { description: 'Allow this cooperative\'s schemes to be listed on the Investor Marketplace.' },
                },
                {
                    name: 'membership_fee_kobo',
                    type: 'number',
                    defaultValue: 0,
                    admin: { description: 'One-time membership fee charged when a new member joins (in Kobo).' },
                },
                {
                    name: 'monthly_dues_kobo',
                    type: 'number',
                    defaultValue: 0,
                    admin: { description: 'Recurring monthly operational dues for all active members (in Kobo).' },
                },
                {
                    name: 'late_payment_penalty_kobo',
                    type: 'number',
                    defaultValue: 50000,
                    admin: { description: 'Fixed penalty for missed Ajo contributions or HP repayments (in Kobo).' },
                },
            ],
        },
        // ── Legacy metadata ────────────────────────────────────────────────────
        {
            name: 'metadata',
            type: 'json',
            admin: {
                description: '[LEGACY] Extended JSON parameters. New implementations should use the structured fields above. The authorizedProducts key within this JSON is deprecated in favour of the authorized_product_types relationship field.',
            },
        },
    ],
    timestamps: true,
}
