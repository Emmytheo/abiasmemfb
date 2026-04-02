import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { compileSDLToFlow } from '@/lib/workflow/sdl'
import yaml from 'yaml'

export async function POST(req: Request) {
    try {
        const contentType = req.headers.get('content-type') || ''
        const rawBody = await req.text()
        
        let sdlConfig;

        // Support both strict JSON mapping and human-readable YAML
        if (contentType.includes('yaml') || contentType.includes('x-yaml')) {
            sdlConfig = yaml.parse(rawBody)
        } else {
            sdlConfig = JSON.parse(rawBody)
        }

        if (!sdlConfig || !sdlConfig.name || !sdlConfig.steps) {
            return NextResponse.json({ error: 'Invalid SDL configuration.' }, { status: 400 })
        }

        // Compile to React Flow engine format
        const compiledDoc = compileSDLToFlow(sdlConfig)
        const payload = await getPayload({ config })

        // Check if updating an existing workflow (by name convention) or creating a new one
        const existingRes = await payload.find({
            collection: 'workflows',
            where: { name: { equals: compiledDoc.name } },
            limit: 1
        })

        let savedDoc;
        if (existingRes.docs.length > 0) {
            const id = existingRes.docs[0].id
            savedDoc = await payload.update({
                collection: 'workflows',
                id,
                data: compiledDoc as any
            })
        } else {
            savedDoc = await payload.create({
                collection: 'workflows',
                data: compiledDoc as any
            })
        }

        return NextResponse.json({
            message: 'Workflow successfully compiled and saved.',
            workflowId: savedDoc.id,
            nodesGenerated: compiledDoc.definition.nodes.length,
            edgesGenerated: compiledDoc.definition.edges.length
        })

    } catch (e: any) {
        return NextResponse.json({ 
            error: 'Failed to compile SDL', 
            details: e.message 
        }, { status: 500 })
    }
}
