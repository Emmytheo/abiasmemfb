import { NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@payload-config';
import { createClient } from '@/lib/supabase/server';

export async function GET(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const payload = await getPayload({ config });
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user || user.user_metadata?.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const endpointId = params.id;
        const endpoint = await payload.findByID({
            collection: 'endpoints',
            id: endpointId,
            depth: 1,
        }) as any;

        if (!endpoint) {
            return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 });
        }

        const provider = endpoint.provider;
        if (!provider) {
            return NextResponse.json({ error: 'No provider linked to endpoint' }, { status: 400 });
        }

        // 1. Resolve Health Check URL
        // Priority: Provider healthCheckUrl -> Base URL
        const checkUrl = provider.healthCheckUrl || provider.baseUrl;
        
        if (!checkUrl) {
            return NextResponse.json({ error: 'No health check URL or base URL found' }, { status: 400 });
        }

        // 2. Perform Ping
        const start = Date.now();
        try {
            // Use a HEAD request with a short timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const res = await fetch(checkUrl, {
                method: 'HEAD',
                signal: controller.signal,
                headers: {
                    'User-Agent': 'ABIA-MFB-HealthCheck/1.0',
                }
            });
            clearTimeout(timeoutId);

            const latency = Date.now() - start;

            // 3. Update Provider Status (Optional but helpful)
            await payload.update({
                collection: 'service-providers',
                id: provider.id,
                data: {
                    lastHealthStatus: res.ok ? 'healthy' : 'degraded',
                    lastHealthCheckedAt: new Date().toISOString(),
                    avgLatencyMs: latency,
                }
            });

            return NextResponse.json({
                healthy: res.ok,
                status: res.status,
                latencyMs: latency,
                url: checkUrl
            });
        } catch (pingError: any) {
            console.error(`Health ping failed for ${checkUrl}:`, pingError.message);
            
            await payload.update({
                collection: 'service-providers',
                id: provider.id,
                data: {
                    lastHealthStatus: 'down',
                    lastHealthCheckedAt: new Date().toISOString(),
                }
            });

            return NextResponse.json({
                healthy: false,
                error: pingError.message,
                url: checkUrl
            }, { status: 500 });
        }
    } catch (error: any) {
        console.error('[HEALTH_CHECK_ERROR]', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
