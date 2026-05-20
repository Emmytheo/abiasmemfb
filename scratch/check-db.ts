import { getPayload } from 'payload'
import config from '../payload.config'
import { loadEnvConfig } from '@next/env'

loadEnvConfig(process.cwd())

async function run() {
    const payload = await getPayload({ config })
    
    // 1. Fetch SiteSettings
    const settings = await payload.findGlobal({ slug: 'site-settings', depth: 2 })
    console.log("=== Site Settings Sync Configuration ===")
    console.log(JSON.stringify(settings.sync, null, 2))
    
    // 2. Fetch all Endpoints
    const endpoints = await payload.find({
        collection: 'endpoints',
        limit: 100,
        depth: 1
    })
    console.log("\n=== Registered Endpoints ===")
    endpoints.docs.forEach((ep: any) => {
        console.log(`- ID: ${ep.id} | Name: ${ep.name} | Method: ${ep.method} | Path: ${ep.path}`)
    })
    
    process.exit(0)
}

run().catch(err => {
    console.error(err)
    process.exit(1)
})
