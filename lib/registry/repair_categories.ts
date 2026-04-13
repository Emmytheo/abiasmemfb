import { getPayload } from 'payload';
import config from '../../payload.config'; 

/**
 * Registry Mapping Repair Utility
 * Logic:
 * 1. Find all Service Categories.
 * 2. Identify redundant categories (those created by the bootstrap based on name vs slug mismatch).
 * 3. Re-assign services to the correct categories.
 * 4. Cleanup redundant categories.
 */
async function repair() {
    console.log("Initializing Payload...");
    const payload = await getPayload({ config });

    // 1. Audit Service Categories
    console.log("Auditing Service Categories...");
    const { docs: categories } = await payload.find({ 
        collection: 'service-categories',
        limit: 100 
    });

    const categoriesBySlug = new Map<string, any[]>();
    categories.forEach(cat => {
        const slug = cat.slug || cat.name.toLowerCase().replace(/\s+/g, '-');
        if (!categoriesBySlug.has(slug)) categoriesBySlug.set(slug, []);
        categoriesBySlug.get(slug)?.push(cat);
    });

    console.log(`Found ${categoriesBySlug.size} unique slugs across ${categories.length} categories.`);

    for (const [slug, cats] of categoriesBySlug.entries()) {
        if (cats.length > 1) {
            console.log(`\n[Conflict] Slug "${slug}" has ${cats.length} records:`);
            
            // Heuristic: Keep the one with the shortest name or the one that's NOT capitalized slug
            // Usually the original might be "Funds Transfer" and the new one is "Transfers"
            cats.sort((a, b) => {
                 const aIsGenerated = a.name.toLowerCase() === a.slug;
                 const bIsGenerated = b.name.toLowerCase() === b.slug;
                 if (aIsGenerated && !bIsGenerated) return 1; // Put generated ones at end
                 if (!aIsGenerated && bIsGenerated) return -1;
                 return (a.id < b.id) ? -1 : 1;
            });

            const keep = cats[0];
            const others = cats.slice(1);

            console.log(`Keeping: ${keep.name} (ID: ${keep.id})`);
            
            for (const other of others) {
                console.log(`Merging ${other.name} (ID: ${other.id}) -> ${keep.name}...`);
                
                // Find services in the "bad" category
                const { docs: services } = await payload.find({
                    collection: 'services',
                    where: { category: { equals: other.id } },
                    limit: 1000
                });

                console.log(`   - Moving ${services.length} services...`);
                for (const svc of services) {
                    await payload.update({
                        collection: 'services',
                        id: svc.id,
                        data: { category: keep.id }
                    });
                }

                // Delete the redundant category
                console.log(`   - Deleting redundant category ${other.name}...`);
                await payload.delete({
                    collection: 'service-categories',
                    id: other.id
                });
            }
        }
    }

    console.log("\nRepair Complete. All services reconciled.");
    process.exit(0);
}

repair().catch(e => {
    console.error("Repair Failed:", e);
    process.exit(1);
});
