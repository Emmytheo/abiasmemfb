import { NextRequest } from 'next/server';
import { AccountOfficerSyncExecutor } from '@/lib/workflow/executor/AccountOfficerSyncExecutor';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || user.user_metadata?.role !== 'admin') {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        async start(controller) {
            const sendLog = (message: string, type: string) => {
                const data = JSON.stringify({ message, type, timestamp: new Date().toISOString() });
                controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            };

            try {
                // Trigger the executor with the onLog callback
                await AccountOfficerSyncExecutor((message, type) => {
                    sendLog(message, type);
                });

                // Final success message
                sendLog('Account Officer synchronization completed successfully.', 'success');
            } catch (error: any) {
                sendLog(`CRITICAL ERROR: ${error.message}`, 'error');
            } finally {
                controller.close();
            }
        }
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
        },
    });
}
