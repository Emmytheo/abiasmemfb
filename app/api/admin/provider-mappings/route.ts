import { NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@payload-config';

export async function GET() {
    try {
        const payload = await getPayload({ config });
        const result = await payload.find({
            collection: 'provider-mappings' as any,
            depth: 1,
            limit: 200,
            overrideAccess: true,
            sort: 'internalName',
        });
        return NextResponse.json(result);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { internalName, externalCode, productTypeId } = body;

        const payload = await getPayload({ config });
        
        // Find Qore service provider
        const { docs: providers } = await payload.find({
            collection: 'service-providers' as any,
            where: { name: { like: 'Qore' } },
            limit: 1,
        });
        const providerId = providers[0]?.id || (await payload.find({ collection: 'service-providers' as any, limit: 1 })).docs[0]?.id;

        if (!providerId) {
            return NextResponse.json({ error: "No service provider found in registry." }, { status: 400 });
        }

        const created = await payload.create({
            collection: 'provider-mappings' as any,
            data: {
                internalName,
                externalCode,
                provider: providerId,
                relatedEntity: {
                    relationTo: 'product-types',
                    value: productTypeId
                },
                schemaMapping: {}
            },
            overrideAccess: true,
        });

        return NextResponse.json(created);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
