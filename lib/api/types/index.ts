export type Role = 'user' | 'customer' | 'admin';

export interface User {
    id: string;
    email: string;
    full_name: string;
    avatar_url?: string;
    role: Role;
    created_at: string;
}

export interface Account {
    id: string;
    user_id: string;
    account_number: string;
    account_type: 'Savings' | 'Current' | 'Fixed Deposit';
    balance: number;
    status: 'active' | 'dormant' | 'frozen';
    created_at: string;
}

export interface Loan {
    id: string;
    user_id: string;
    product_type_id?: string;
    amount: number;
    interest_rate: number;
    duration_months: number;
    outstanding_balance?: number;
    monthly_installment?: number;
    next_payment_date?: string;
    maturity_date?: string;
    status: 'pending' | 'approved' | 'rejected' | 'repaid' | 'under_review' | 'active' | 'defaulted' | 'written_off';
    created_at: string;
}

export interface FormField {
    id: string;
    label: string;
    type: 'text' | 'number' | 'email' | 'select' | 'file';
    required: boolean;
    options?: string[]; // For select fields
    placeholder?: string;
    description?: string;
}

export interface ProductClass {
    id: string;
    name: string;
    description: string;
    status: 'active' | 'inactive';
    created_at: string;
}

export interface ProductCategory {
    id: string;
    class_id: string;
    name: string;
    description: string;
    status: 'active' | 'inactive';
    created_at: string;
}

export interface LoanTermsConfig {
    blockType: 'loan-terms';
    interest_rate: number;
    min_amount: number;
    max_amount: number;
    min_duration?: number;
    max_duration?: number;
}

export interface SavingsTermsConfig {
    blockType: 'savings-terms';
    interest_rate?: number;
    min_balance: number;
    monthly_maintenance_fee?: number;
}

export interface FixedDepositTermsConfig {
    blockType: 'fixed-deposit-terms';
    interest_rate: number;
    min_amount: number;
    lockup_period: number;
    penalty_rate?: number;
}

export type ProductFinancialTerms = LoanTermsConfig | SavingsTermsConfig | FixedDepositTermsConfig;

export interface ProductType {
    id: string;
    name: string;
    category: string; // References ProductCategory ID or slug
    tagline: string;
    description: string;
    financial_terms: ProductFinancialTerms[];
    image_url?: string;
    form_schema: FormField[];
    workflow_stages: string[]; // e.g., ['Submitted', 'Under Review', 'Approved']
    status: 'active' | 'draft' | 'archived';
    created_at: string;
}

export interface ProductApplication {
    id: string;
    user_id: string;
    product_type_id: string;
    status: 'pending' | 'approved' | 'rejected' | 'under_review';
    workflow_stage: string;
    submitted_data: Record<string, any>;
    requested_amount?: number;
    created_at: string;
    updated_at: string;
}

export interface Transaction {
    id: string;
    user_id: string;
    amount: number;
    type: 'credit' | 'debit';
    category: 'Bills' | 'School Fees' | 'Utilities' | 'e-Pins' | 'Transfer';
    status: 'successful' | 'pending' | 'failed';
    reference: string;
    narration?: string;
    created_at: string;
}

export interface SystemConfig {
    id: string;
    key: string;
    value: string;
    category: 'Global Content' | 'Product Settings';
    updated_at: string;
}

export interface BlogPost {
    id?: string | number;
    slug: string;
    title: string;
    excerpt: string;
    content: string; // HTML or Markdown
    coverImage: string;
    author: {
        name: string;
        role: string;
        avatar: string;
    };
    date: string;
    category: string;
    tags: string[];
    featured: boolean;
    readTime: string;
}

export interface JobPosition {
    id: string;
    title: string;
    department: string;
    location: string;
    type: "Full-time" | "Part-time" | "Contract" | "Remote" | "On-site";
    description?: string;
}

// Unified API Adapter Interface
export interface ApiAdapter {
    // Users
    getCurrentUser: () => Promise<User | null>;
    getAllUsers: () => Promise<User[]>;

    // Products (Accounts, Loans)
    getAllAccounts: () => Promise<Account[]>;
    getUserAccounts: (userId: string) => Promise<Account[]>;
    getAccountById: (id: string) => Promise<Account | null>;
    createAccount: (data: Omit<Account, 'id' | 'created_at' | 'updated_at'>) => Promise<Account>;
    getAllLoans: () => Promise<Loan[]>;
    getUserLoans: (userId: string) => Promise<Loan[]>;
    getLoanById: (id: string) => Promise<Loan | null>;
    createLoan: (data: Omit<Loan, 'id' | 'created_at' | 'updated_at'>) => Promise<Loan>;

    // Product Configuration & Dynamic Forms
    getAllProductClasses: () => Promise<ProductClass[]>;
    createProductClass: (data: Omit<ProductClass, 'id' | 'created_at'>) => Promise<ProductClass>;
    updateProductClass: (id: string, data: Partial<ProductClass>) => Promise<ProductClass>;
    deleteProductClass: (id: string) => Promise<boolean>;

    getAllProductCategories: () => Promise<ProductCategory[]>;
    createProductCategory: (data: Omit<ProductCategory, 'id' | 'created_at'>) => Promise<ProductCategory>;
    updateProductCategory: (id: string, data: Partial<ProductCategory>) => Promise<ProductCategory>;
    deleteProductCategory: (id: string) => Promise<boolean>;

    getAllProductTypes: () => Promise<ProductType[]>;
    getProductTypeById: (id: string) => Promise<ProductType | null>;
    saveProductType: (data: ProductType) => Promise<ProductType>;
    deleteProductType: (id: string) => Promise<boolean>;

    // Product Applications
    createProductApplication: (data: Omit<ProductApplication, 'id' | 'created_at' | 'updated_at'>) => Promise<ProductApplication>;
    updateApplication: (id: string, data: Partial<ProductApplication>) => Promise<ProductApplication>;
    getUserApplications: (userId: string) => Promise<ProductApplication[]>;
    getAllApplications: () => Promise<ProductApplication[]>;

    // Services (Transactions)
    getAllTransactions: () => Promise<Transaction[]>;
    getTransactionsByCategory: (category: Transaction['category']) => Promise<Transaction[]>;

    // Service Integrations
    getServiceCategories: () => Promise<ServiceCategory[]>;
    getServicesByCategory: (categorySlug: string) => Promise<Service[]>;
    getAllServices: () => Promise<Service[]>;
    createServiceCategory: (data: Omit<ServiceCategory, 'id' | 'created_at'>) => Promise<ServiceCategory>;
    updateServiceCategory: (id: string, data: Partial<ServiceCategory>) => Promise<ServiceCategory>;
    deleteServiceCategory: (id: string) => Promise<boolean>;
    createService: (data: Omit<Service, 'id' | 'created_at'>) => Promise<Service>;
    updateService: (id: string, data: Partial<Service>) => Promise<Service>;
    deleteService: (id: string) => Promise<boolean>;
    executeServiceWorkflow: (serviceId: string, formData: Record<string, any>) => Promise<string>;
    validateServiceWorkflow: (serviceId: string, formData: Record<string, any>) => Promise<any>;
    getWorkflowExecutionById: (executionId: string) => Promise<any>;

    // Settings (Config)
    getConfigsByCategory: (category: SystemConfig['category']) => Promise<SystemConfig[]>;

    // Global CMS
    getPageBySlug: (slug: string) => Promise<any | null>;

    // Blog
    getBlogPosts: () => Promise<BlogPost[]>;
    getBlogPostBySlug: (slug: string) => Promise<BlogPost | undefined>;
    getFeaturedPosts: () => Promise<BlogPost[]>;
    getPostsByCategory: (categorySlug: string) => Promise<BlogPost[]>;
    getPopularPosts: () => Promise<BlogPost[]>;
    getAllTags: () => Promise<string[]>;

    // Careers
    getOpenPositions: () => Promise<JobPosition[]>;
}

export interface ServiceCategory {
    id: string;
    name: string;
    slug: string;
    description?: string;
    icon?: string;
    status: 'active' | 'inactive';
    created_at: string;
}

export interface ServiceFormSchema {
    id: string;
    name: string; // Internal variable name
    label: string; // UI label
    type: 'text' | 'number' | 'email' | 'select' | 'destination_bank_lookup';
    required: boolean;
    placeholder?: string;
    options?: string; // Comma-separated options for 'select'
    triggers_validation: boolean;
}

export interface Service {
    id: string;
    name: string;
    category: string; // ServiceCategory ID
    provider?: string; // ServiceProviders ID
    provider_service_code?: string;
    validation_workflow?: string; // Workflows ID
    execution_workflow?: string; // Workflows ID
    fee_type: 'none' | 'flat' | 'percentage' | 'tiered';
    fee_value?: number;
    form_schema: ServiceFormSchema[];
    status: 'active' | 'inactive';
    created_at: string;
}
