import { NextResponse } from 'next/server';
import { getPayload } from 'payload';
import configPromise from '@payload-config';

export async function GET() {
    try {
        const payload = await getPayload({ config: configPromise });
        const { docs: services } = await payload.find({
            collection: 'services' as any,
            limit: 10,
            depth: 1,
        });

        const report = services.map((s: any) => ({
            id: s.id,
            name: s.name,
            intent: s.service_intent,
            form_schema_count: s.form_schema?.length || 0,
            form_schema: s.form_schema?.map((f: any) => ({
                name: f.name,
                type: f.type,
                events_count: f.events?.length || 0
            }))
        }));

        return NextResponse.json({ 
            success: true, 
            count: services.length,
            services: report
        });
    } catch (error: any) {
        return NextResponse.json({ 
            success: false, 
            error: error.message 
        }, { status: 500 });
    }
}
