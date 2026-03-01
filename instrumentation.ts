export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        console.log('[Instrumentation] Node.js server starting...')
        // Dynamically import the cron runner so it only loads in the Node.js context
        const { rescheduleAll } = await import('./lib/workflow/scheduler/cronRunner')
        await rescheduleAll()
    }
}
