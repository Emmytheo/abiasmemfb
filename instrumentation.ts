export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        console.log('[Instrumentation] Node.js server starting...')
        // Dynamically import the cron runner so it only loads in the Node.js context
        if (process.env.NEXT_PUBLIC_USE_DUMMY_DATA !== 'true') {
            const { rescheduleAll } = await import('./lib/workflow/scheduler/cronRunner')
            await rescheduleAll().catch(err => {
                console.error('[Instrumentation] Failed to initialize scheduler:', err.message)
            })
        } else {
            console.log('[Instrumentation] Skipping scheduler (Dummy Data mode active)')
        }
    }
}
