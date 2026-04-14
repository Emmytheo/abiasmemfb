import { getPayload } from 'payload'
import config from '../payload.config'

async function patch() {
    const payload = await getPayload({ config })
    
    const settings: any = await payload.findGlobal({ slug: 'site-settings', overrideAccess: true })
    const bvnEndpointId = settings?.sync?.bvnLookupEndpoint?.id || settings?.sync?.bvnLookupEndpoint
    
    if (!bvnEndpointId) {
        console.error('BVN Endpoint ID not found in site settings.')
        return
    }

    console.log(`Patching endpoint ${bvnEndpointId}...`)
    
    await payload.update({
        collection: 'endpoints' as any,
        id: bvnEndpointId,
        data: {
            method: 'POST',
            authOverride: 'BODY_FIELD',
            authBodyFieldKey: 'Token', // Critical: SDL template requires 'Token' for this specific call
            status: 'active'
        } as any,
        overrideAccess: true
    })

    console.log('SUCCESS: BVN endpoint patched with Token auth.')
}

patch().catch(console.error)
