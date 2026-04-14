import { getPayload } from 'payload'
import config from '../payload.config'

async function debug() {
    const payload = await getPayload({ config })
    
    console.log('--- SITE SETTINGS ---')
    const settings: any = await payload.findGlobal({ slug: 'site-settings', overrideAccess: true })
    console.log(JSON.stringify(settings, null, 2))
    
    const bvnEndpointId = settings?.sync?.bvnLookupEndpoint?.id || settings?.sync?.bvnLookupEndpoint
    if (bvnEndpointId) {
        console.log('\n--- BVN ENDPOINT ---')
        const endpoint = await payload.findByID({
            collection: 'endpoints',
            id: bvnEndpointId,
            depth: 2
        })
        console.log(JSON.stringify(endpoint, null, 2))
    } else {
        console.log('\nBVN Endpoint ID not found in site settings.')
    }
}

debug().catch(console.error)
