-- ==============================================================================
-- ABIASMEMFB - Supabase Transactional Schema Setup
-- Run this script in the Supabase SQL Editor.
-- ==============================================================================

-- 1. Create Core Tables
-- Note: 'product_types' and 'users' are managed by Payload CMS in the same DB,
-- so we store their references as strings without enforcing strict foreign keys
-- to avoid coupling Supabase DDL to Payload's dynamic table structure.

-- ACCOUNTS
CREATE TABLE public.accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    account_number VARCHAR(20) UNIQUE NOT NULL,
    account_type VARCHAR(50) NOT NULL CHECK (account_type IN ('Savings', 'Current', 'Fixed Deposit')),
    balance DECIMAL(15, 2) DEFAULT 0.00,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'dormant', 'frozen')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PRODUCT APPLICATIONS
CREATE TABLE public.product_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    product_type_id VARCHAR(255) NOT NULL, -- References Payload CMS product-types ID
    status VARCHAR(50) DEFAULT 'under_review' CHECK (status IN ('pending', 'approved', 'rejected', 'under_review')),
    workflow_stage VARCHAR(100) DEFAULT 'Submitted',
    submitted_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    requested_amount DECIMAL(15, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- LOANS
CREATE TABLE public.loans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    application_id UUID REFERENCES public.product_applications(id) ON DELETE SET NULL,
    product_type_id VARCHAR(255), -- References Payload CMS product-types ID
    amount DECIMAL(15, 2) NOT NULL,
    interest_rate DECIMAL(5, 2) NOT NULL,
    duration_months INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'repaid', 'under_review', 'active')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TRANSACTIONS
CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
    amount DECIMAL(15, 2) NOT NULL,
    type VARCHAR(10) NOT NULL CHECK (type IN ('credit', 'debit')),
    category VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('successful', 'pending', 'failed')),
    reference VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Configure Row Level Security (RLS)

ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Customers can view their own data
CREATE POLICY "Users can view their own accounts" ON public.accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own applications" ON public.product_applications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own loans" ON public.loans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id);

-- Customers can create applications
CREATE POLICY "Users can submit applications" ON public.product_applications FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Customers cannot update or delete these records directly (managed via Admin / API)
-- Admins (using service role or specific role check) bypass RLS automatically if using Supabase Service Key, 
-- but since Payload uses normal postgres bindings for its admin, we don't strictly enforce RLS against the backend DB adapter.

-- 3. Functions & Triggers

-- Auto-update updated_at for Product Applications
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_product_applications_updated_at
    BEFORE UPDATE ON public.product_applications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
