import { getPayload } from 'payload';
import config from '@payload-config';
import { resolveEndpoint } from '../utils/apiResolver';

interface QoreProduct {
    Id: number;
    ProductCode: string;
    ProductName: string;
    ProductDiscriminator: string; // 'SavingsorCurrent' | 'Loan' | 'FixedDeposit'
    InterestRate?: number;
    Tenure?: number;
}

/**
 * RegistryBulkSyncExecutor: Automates the provisioning of Core Banking products into the CMS.
 * Handles recursive creation of ProductClasses and ProductCategories when discovered.
 */
export async function RegistryBulkSyncExecutor() {
    const payload = await getPayload({ config });
    const results = {
        created: 0,
        updated: 0,
        errors: 0,
        details: [] as string[]
    };

    try {
        // 1. Fetch products from Qore Core (DYNAMIC ENDPOINT RESOLUTION)
        // prioritize by name "Get Products" then fallback to path
        let endpoints = await payload.find({
            collection: 'endpoints',
            where: {
                name: { equals: 'Get Products' }
            },
            limit: 1,
            depth: 2
        });

        if (endpoints.docs.length === 0) {
            endpoints = await payload.find({
                collection: 'endpoints',
                where: {
                    path: { contains: 'Product/Get' }
                },
                limit: 1,
                depth: 2
            });
        }

        if (endpoints.docs.length === 0) {
            throw new Error("Registry Sync failed: No 'Get Products' endpoint found in CMS. Please ensure the endpoint exists and is named correctly.");
        }

        const endpointDoc = endpoints.docs[0];
        
        // Resolve Institution Code from provider metadata if available
        const provider = typeof endpointDoc.provider === 'object' ? endpointDoc.provider : null;
        const institutionCode = provider?.metadata?.institutionCode || "0017"; 

        const resolved = await resolveEndpoint(endpointDoc, {
            query: { mfbCode: institutionCode }
        });

        const fetchRes = await fetch(resolved.url, {
            method: resolved.method,
            headers: resolved.headers,
            body: resolved.method !== 'GET' ? JSON.stringify(resolved.body) : undefined
        });

        if (!fetchRes.ok) {
            const errText = await fetchRes.text();
            throw new Error(`Upstream API Error: ${fetchRes.status} - ${errText}`);
        }

        const resData = await fetchRes.json();
        
        // Determine product array location based on endpoint config or standard paths
        let allProducts: QoreProduct[] = [];
        if (resData.Payload && Array.isArray(resData.Payload)) {
            allProducts = resData.Payload;
        } else if (Array.isArray(resData)) {
            allProducts = resData;
        } else if (resData.data && Array.isArray(resData.data)) {
            allProducts = resData.data;
        } else if (resData.products && Array.isArray(resData.products)) {
            allProducts = resData.products;
        }

        if (allProducts.length === 0) {
            results.details.push(`[INFO] No products returned from upstream API.`);
        }

        for (const qoreProd of allProducts) {
            try {
                // 2. Determine Class (Hierarchy Level 1)
                const classTitle = qoreProd.ProductDiscriminator === 'Loan' ? 'Loans' : 'Accounts';
                const classSlug = classTitle.toLowerCase();
                
                let productClass = await payload.find({
                    collection: 'product-classes',
                    where: { name: { equals: classTitle } },
                    limit: 1
                });

                let classId: string | number;
                if (productClass.docs.length === 0) {
                    const newClass = await payload.create({
                        collection: 'product-classes',
                        data: { name: classTitle, description: `Automated Class for ${classTitle}`, status: 'active' }
                    });
                    classId = newClass.id;
                    results.details.push(`[NEW CLASS] Created ${classTitle}`);
                } else {
                    classId = productClass.docs[0].id;
                }

                // 3. Determine Category (Hierarchy Level 2)
                // We'll use the ProductDiscriminator as a baseline, but special handle "CommitmentSavings" if it appears in the Name.
                let categoryName = qoreProd.ProductDiscriminator === 'SavingsorCurrent' ? 'Savings & Current' : qoreProd.ProductDiscriminator;
                if (qoreProd.ProductName.toLowerCase().includes('commitment')) categoryName = 'Commitment Savings';
                if (qoreProd.ProductDiscriminator === 'FixedDeposit') categoryName = 'Fixed Deposits';
                
                let productCategory = await payload.find({
                    collection: 'product-categories',
                    where: { 
                        and: [
                            { name: { equals: categoryName } },
                            { class_id: { equals: classId } }
                        ]
                    },
                    limit: 1
                });

                let categoryId: string | number;
                if (productCategory.docs.length === 0) {
                    if (!classId) throw new Error(`Missing classId for ${categoryName}`);
                    
                    const newCat = await payload.create({
                        collection: 'product-categories',
                        data: { 
                            name: categoryName, 
                            class_id: classId, 
                            description: `Automated Category for ${categoryName}`, 
                            status: 'active' 
                        }
                    });
                    categoryId = newCat.id;
                    results.details.push(`[NEW CATEGORY] Created ${categoryName} under ${classTitle}`);
                } else {
                    categoryId = productCategory.docs[0].id;
                }

                // 4. Consolidate ProductType (Hierarchy Level 3)
                // We use the provider ID from our endpointDoc to be exact
                const qoreProviderId = typeof endpointDoc.provider === 'object' ? endpointDoc.provider.id : endpointDoc.provider;
                
                const existingProduct = await payload.find({
                    collection: 'product-types',
                    where: { 
                        or: [
                            { name: { equals: qoreProd.ProductName } },
                        ]
                    },
                    limit: 1
                });

                // Check mapping separately to be robust
                const mapping = await payload.find({
                    collection: 'provider-mappings',
                    where: { 
                        and: [
                            { externalCode: { equals: qoreProd.ProductCode } },
                            { provider: { equals: qoreProviderId } }
                        ]
                    },
                    limit: 1
                });

                let productTypeId: string | number;
                
                if (existingProduct.docs.length > 0 || mapping.docs.length > 0) {
                    
                    // Update/Consolidate
                    const targetProduct = existingProduct.docs[0] || (mapping.docs[0].relatedEntity?.value as any);
                    if (!targetProduct) throw new Error("Mapping found but internal product missing.");

                    await payload.update({
                        collection: 'product-types',
                        id: targetProduct.id,
                        data: {
                            category: categoryId,
                            tagline: targetProduct.tagline || `Abia MFB ${qoreProd.ProductName}`,
                            // Preserve form_schema and workflows but sync interest rate
                            financial_terms: targetProduct.financial_terms?.map((term: any) => {
                                if (term.blockType === 'savings-terms' || term.blockType === 'loan-terms') {
                                    return { ...term, interest_rate: qoreProd.InterestRate || term.interest_rate };
                                }
                                return term;
                            }) || []
                        }
                    });
                    productTypeId = targetProduct.id;
                    results.updated++;
                } else {
                    // Create New ProductType
                    const newProd = await payload.create({
                        collection: 'product-types',
                        data: {
                            name: qoreProd.ProductName,
                            category: categoryId,
                            tagline: `Reliable ${qoreProd.ProductName} from Abia MFB`,
                            description: `The ${qoreProd.ProductName} is designed for our valued customers. Sync'd from Core Banking.`,
                            status: 'draft',
                            workflow_stages: [
                                { stage: 'Submitted' },
                                { stage: 'Under Review' },
                                { stage: 'Approved' }
                            ],
                            form_schema: [
                                { label: 'Preferred Account Name', type: 'text', required: true }
                            ],
                            financial_terms: [
                                {
                                    blockType: qoreProd.ProductDiscriminator === 'Loan' ? 'loan-terms' : 'savings-terms',
                                    interest_rate: qoreProd.InterestRate || 0,
                                    // Add mandatory fields for the blocks
                                    min_amount: 1000,
                                    max_amount: 10000000,
                                    min_balance: 0,
                                } as any
                            ]
                        }
                    });
                    productTypeId = newProd.id;
                    results.created++;
                    results.details.push(`[NEW PRODUCT] Created ${qoreProd.ProductName} (${qoreProd.ProductCode})`);
                }

                // 5. Ensure Provider Mapping (Sync Link)
                if (mapping.docs.length === 0) {
                    await payload.create({
                        collection: 'provider-mappings',
                        data: {
                            internalName: `${qoreProd.ProductName} Qore Mapping`,
                            provider: qoreProviderId as any,
                            externalCode: qoreProd.ProductCode,
                            relatedEntity: {
                                relationTo: 'product-types',
                                value: productTypeId as any
                            },
                            mappingType: 'product',
                            status: 'active'
                        }
                    } as any); 
                }

            } catch (err: any) {
                results.errors++;
                results.details.push(`[ERROR] Failed to sync ${qoreProd.ProductName}: ${err.message}`);
            }
        }
    } catch (globalErr: any) {
        console.error("[SYNC ENGINE CRITICAL FAILURE]", globalErr);
        throw new Error(`Sync Engine Failed: ${globalErr.message}. See server console for stack trace.`);
    }

    return results;
}
