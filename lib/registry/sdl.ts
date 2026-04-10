import { getPayload } from 'payload';
import config from '@payload-config';
import { RegistryBundleSDL, ProductTypeSDL, ServiceSDL } from './types';

/**
 * importRegistryBundle: Provisions the CMS with a portable registry definition.
 * Implements "Merge" logic to preserve existing manual configurations.
 */
/**
 * importRegistryBundle: Provisions the CMS with a portable registry definition.
 * Implements "Merge" logic to preserve existing manual configurations.
 */
export async function importRegistryBundle(bundle: RegistryBundleSDL) {
    const payload = await getPayload({ config });
    const stats = { products: 0, services: 0, errors: [] as string[] };
    
    // Shared cache for the duration of this import session to prevent redundant DB calls
    const cache = {
        classes: new Map<string, any>(),
        categories: new Map<string, any>(),
        serviceCategories: new Map<string, any>(),
        workflows: new Map<string, any>()
    };

    // --- Process Products ---
    for (const prod of bundle.products) {
        try {
            // 1. Ensure Hierarchy (Class -> Category)
            const productClass = await findOrCreateProductClass(payload, prod.classSlug, cache);
            const productCategory = await findOrCreateProductCategory(payload, prod.categorySlug, productClass.id, cache);

            // 2. Upsert ProductType (Merge Logic)
            const existing = await payload.find({
                collection: 'product-types',
                where: { name: { equals: prod.name } },
                limit: 1
            });

            let productTypeId: string | number;
            if (existing.docs.length > 0) {
                const target = existing.docs[0];
                await payload.update({
                    collection: 'product-types',
                    id: target.id,
                    data: {
                        category: productCategory.id,
                        tagline: prod.tagline || target.tagline,
                        description: prod.description || target.description,
                        form_schema: prod.form_schema || target.form_schema,
                        financial_terms: prod.financial_terms || target.financial_terms,
                        status: prod.status || target.status,
                    }
                });
                productTypeId = target.id;
            } else {
                const created = await payload.create({
                    collection: 'product-types',
                    data: {
                        name: prod.name,
                        category: productCategory.id,
                        tagline: prod.tagline || `About ${prod.name}`,
                        description: prod.description || `Description of ${prod.name}`,
                        form_schema: prod.form_schema || [],
                        financial_terms: prod.financial_terms || [],
                        status: prod.status || 'draft',
                        workflow_stages: prod.workflow_stages || ['Submitted', 'Approved']
                    }
                });
                productTypeId = created.id;
            }

            // 3. Optional Mapping
            if (prod.externalCode) {
                await ensureProviderMapping(payload, 'qore', prod.externalCode, productTypeId, 'product-types', prod.name);
            }

            stats.products++;
        } catch (e: any) {
            stats.errors.push(`Product [${prod.name}]: ${e.message}`);
        }
    }

    // --- Process Services ---
    for (const svc of bundle.services) {
        try {
            const category = await findOrCreateServiceCategory(payload, svc.categorySlug, cache);
            const validationWf = svc.validation_workflow_slug ? await findWorkflowBySlug(payload, svc.validation_workflow_slug, cache) : null;
            const executionWf = svc.execution_workflow_slug ? await findWorkflowBySlug(payload, svc.execution_workflow_slug, cache) : null;

            const existing = await payload.find({
                collection: 'services',
                where: { name: { equals: svc.name } },
                limit: 1
            });

            if (existing.docs.length > 0) {
                await payload.update({
                    collection: 'services',
                    id: existing.docs[0].id,
                    data: {
                        category: category.id,
                        validation_workflow: validationWf?.id || undefined,
                        execution_workflow: executionWf?.id || undefined,
                        form_schema: svc.form_schema || existing.docs[0].form_schema,
                        fee_type: svc.fee_type || existing.docs[0].fee_type,
                        fee_value: svc.fee_value ?? existing.docs[0].fee_value
                    }
                });
            } else {
                await payload.create({
                    collection: 'services',
                    data: {
                        name: svc.name,
                        category: category.id,
                        validation_workflow: validationWf?.id,
                        execution_workflow: executionWf?.id,
                        form_schema: svc.form_schema || [],
                        fee_type: svc.fee_type || 'none',
                        fee_value: svc.fee_value || 0,
                        status: svc.status || 'active'
                    }
                });
            }
            stats.services++;
        } catch (e: any) {
            stats.errors.push(`Service [${svc.name}]: ${e.message}`);
        }
    }

    return stats;
}

/**
 * exportRegistryBundle: Dumps the entire CMS registry into a portable SDL format.
 */
export async function exportRegistryBundle(version: string = "1.0.0"): Promise<RegistryBundleSDL> {
    const payload = await getPayload({ config });
    
    // 1. Fetch all products with logic
    const productDocs = await payload.find({ collection: 'product-types', limit: 1000 });
    const products: ProductTypeSDL[] = await Promise.all(productDocs.docs.map(async (p: any) => {
        const cat = typeof p.category === 'object' ? p.category : await payload.findByID({ collection: 'product-categories', id: p.category });
        const pClass = typeof cat.class_id === 'object' ? cat.class_id : await payload.findByID({ collection: 'product-classes', id: cat.class_id });
        
        // Find external mapping
        const mapping = await payload.find({ 
            collection: 'provider-mappings', 
            where: { 
                'relatedEntity.value': { equals: p.id }
            },
            limit: 1
        });

        return {
            name: p.name,
            categorySlug: cat.name.toLowerCase(),
            classSlug: pClass.name.toLowerCase(),
            tagline: p.tagline,
            description: p.description,
            image_url: p.image_url,
            status: p.status,
            form_schema: p.form_schema || [],
            workflow_stages: p.workflow_stages || [],
            financial_terms: p.financial_terms || [],
            externalCode: mapping.docs[0]?.externalCode
        };
    }));

    // 2. Fetch all services
    const serviceDocs = await payload.find({ collection: 'services', limit: 1000 });
    const services: ServiceSDL[] = await Promise.all(serviceDocs.docs.map(async (s: any) => {
        const cat = typeof s.category === 'object' ? s.category : await payload.findByID({ collection: 'service-categories', id: s.category });
        const valWf = s.validation_workflow ? (typeof s.validation_workflow === 'object' ? s.validation_workflow : await payload.findByID({ collection: 'workflows', id: s.validation_workflow })) : null;
        const exeWf = s.execution_workflow ? (typeof s.execution_workflow === 'object' ? s.execution_workflow : await payload.findByID({ collection: 'workflows', id: s.execution_workflow })) : null;
        
        return {
            name: s.name,
            categorySlug: cat.name.toLowerCase(),
            provider_service_code: s.provider_service_code,
            validation_workflow_slug: valWf?.name,
            execution_workflow_slug: exeWf?.name,
            fee_type: s.fee_type,
            fee_value: s.fee_value,
            form_schema: s.form_schema || [],
            status: s.status
        };
    }));

    return {
        version,
        products,
        services
    };
}

// --- Helper Functions ---

async function findOrCreateProductClass(payload: any, slug: string, cache: any) {
    const key = slug.toLowerCase();
    if (cache.classes.has(key)) return cache.classes.get(key);

    const existing = await payload.find({ collection: 'product-classes', where: { name: { equals: slug.charAt(0).toUpperCase() + slug.slice(1) } }, limit: 1 });
    const result = existing.docs.length > 0 
        ? existing.docs[0] 
        : await payload.create({ collection: 'product-classes', data: { name: slug.charAt(0).toUpperCase() + slug.slice(1), status: 'active' } });
    
    cache.classes.set(key, result);
    return result;
}

async function findOrCreateProductCategory(payload: any, slug: string, classId: string | number, cache: any) {
    const key = `${classId}_${slug.toLowerCase()}`;
    if (cache.categories.has(key)) return cache.categories.get(key);

    const existing = await payload.find({ collection: 'product-categories', where: { name: { equals: slug.charAt(0).toUpperCase() + slug.slice(1) } }, limit: 1 });
    const result = existing.docs.length > 0 
        ? existing.docs[0] 
        : await payload.create({ collection: 'product-categories', data: { name: slug.charAt(0).toUpperCase() + slug.slice(1), class_id: classId, status: 'active' } });
    
    cache.categories.set(key, result);
    return result;
}

async function findOrCreateServiceCategory(payload: any, slug: string, cache: any) {
    const key = slug.toLowerCase();
    if (cache.serviceCategories.has(key)) return cache.serviceCategories.get(key);

    const existing = await payload.find({ collection: 'service-categories', where: { name: { equals: slug.charAt(0).toUpperCase() + slug.slice(1) } }, limit: 1 });
    const result = existing.docs.length > 0 
        ? existing.docs[0] 
        : await payload.create({ collection: 'service-categories', data: { name: slug.charAt(0).toUpperCase() + slug.slice(1), status: 'active' } });
    
    cache.serviceCategories.set(key, result);
    return result;
}

async function findWorkflowBySlug(payload: any, slug: string, cache: any) {
    if (cache.workflows.has(slug)) return cache.workflows.get(slug);

    const res = await payload.find({ collection: 'workflows', where: { name: { contains: slug } }, limit: 1 });
    const result = res.docs[0] || null;
    
    if (result) cache.workflows.set(slug, result);
    return result;
}

async function ensureProviderMapping(payload: any, provider: string, externalCode: string, internalId: string | number, relationTo: string, label: string) {
    const mapping = await payload.find({ collection: 'provider-mappings', where: { and: [{ externalCode: { equals: externalCode } }, { provider: { equals: provider } }] }, limit: 1 });
    if (mapping.docs.length === 0) {
        await payload.create({ 
            collection: 'provider-mappings', 
            data: { 
                internalName: `${label} Mapping`,
                provider, 
                externalCode, 
                relatedEntity: {
                    relationTo,
                    value: internalId
                },
                status: 'active' 
            } 
        });
    }
}

