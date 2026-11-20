import { requireMaintenanceAccess } from '@/lib/auth/server-guard';
import { NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@/payload.config';
import * as fs from 'fs';
import * as path from 'path';

export async function GET() {
    const __authGuard = await requireMaintenanceAccess(new Request('http://internal'));
    if (__authGuard instanceof NextResponse) return __authGuard;
    try {
        const payload = await getPayload({ config });
        
        const sdlPath = path.join(process.cwd(), 'lib/workflow/templates/transfer_services.sdl.json');
        const fileContent = fs.readFileSync(sdlPath, 'utf-8');
        const schema = JSON.parse(fileContent);

        let cat = await payload.find({
            collection: 'service-categories',
            where: { slug: { equals: 'transfers' } },
            limit: 1
        });

        let categoryId = cat.docs[0]?.id;
        if (!categoryId) {
            const newCat = await payload.create({
                collection: 'service-categories',
                data: {
                    name: 'Transfers & Payments',
                    slug: 'transfers',
                    description: 'Send money internally, to other banks, or internationally.',
                    icon: 'ArrowRightLeft',
                    status: 'active'
                } as any
            });
            categoryId = newCat.id;
        }

        const results = [];
        for (const serviceData of schema.services) {
            const existing = await payload.find({
                collection: 'services',
                where: { provider_service_code: { equals: serviceData.provider_service_code } },
                limit: 1
            });

            if (existing.docs.length > 0) {
                await payload.update({
                    collection: 'services',
                    id: existing.docs[0].id,
                    data: {
                        ...serviceData,
                        category: categoryId
                    } as any
                });
                results.push(`Updated: ${serviceData.name}`);
            } else {
                await payload.create({
                    collection: 'services',
                    data: {
                        ...serviceData,
                        category: categoryId
                    } as any
                });
                results.push(`Created: ${serviceData.name}`);
            }
        }

        return NextResponse.json({ success: true, results });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
