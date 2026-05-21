import { getPayload } from 'payload'
import config from '../payload.config'
import { loadEnvConfig } from '@next/env'

loadEnvConfig(process.cwd())

async function run() {
    const payload = await getPayload({ config })
    const customers = await payload.find({
        collection: 'customers',
        limit: 100,
        overrideAccess: true,
    })
    console.log("=== Active Customers ===")
    customers.docs.forEach((c: any) => {
        console.log(`- ID: ${c.id} | Email: ${c.email} | Name: ${c.customer_name} | Supabase ID: ${c.supabase_id}`)
    })
    process.exit(0)
}

run().catch(err => {
    console.error(err)
    process.exit(1)
})
