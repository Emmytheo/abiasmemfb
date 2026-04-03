import { FormField, FieldValidation, FieldEvent } from '../api/types';

export interface ProductTypeSDL {
    name: string;
    categorySlug: string; // Used for portable referencing
    classSlug: string; 
    tagline?: string;
    description?: string;
    image_url?: string;
    status?: 'active' | 'inactive' | 'draft';
    form_schema: FormField[];
    workflow_stages?: string[];
    financial_terms?: any[];
    externalCode?: string; // Qore mapping
}

export interface ServiceSDL {
    name: string;
    categorySlug: string;
    providerSlug?: string;
    provider_service_code?: string;
    validation_workflow_slug?: string;
    execution_workflow_slug?: string;
    fee_type?: 'flat' | 'percentage' | 'none';
    fee_value?: number;
    form_schema: FormField[];
    status?: 'active' | 'inactive';
}

export interface RegistryBundleSDL {
    version: string;
    products: ProductTypeSDL[];
    services: ServiceSDL[];
}
