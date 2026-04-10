import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { compileSDLToFlow } from '@/lib/workflow/sdl'
import { ingestBlueprint, type BlueprintSDL } from '@/lib/workflow/blueprint'
import fs from 'fs'
import path from 'path'

export async function GET() {
    try {
        const payload = await getPayload({ config })
        const templatesDir = path.join(process.cwd(), 'lib/workflow/templates')
        
        const allFiles = fs.readdirSync(templatesDir)

        const blueprintFiles = allFiles.filter(f => f.endsWith('.blueprint.json'))
        const sdlFiles = allFiles.filter(f => f.endsWith('.sdl.json'))

        const results: Record<string, any> = {
            blueprints: [],
            workflows: []
        }

        // ── Phase 1: Ingest API Blueprints first ────────────────────────────
        // Ensures Providers and Endpoints exist before workflows reference them.
        for (const file of blueprintFiles) {
            const filePath = path.join(templatesDir, file)
            const blueprint: BlueprintSDL = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
            
            console.log(`[Bootstrap] Ingesting blueprint: ${blueprint.name}...`)
            const result = await ingestBlueprint(blueprint, payload)
            
            results.blueprints.push({
                file,
                name: blueprint.name,
                provider: result.provider,
                endpointsUpserted: result.endpoints.length,
                mappingsUpserted: result.mappings.length,
                errors: result.errors
            })

            if (result.errors.length > 0) {
                console.warn(`[Bootstrap] Blueprint "${blueprint.name}" had ${result.errors.length} errors:`, result.errors)
            } else {
                console.log(`[Bootstrap] Blueprint "${blueprint.name}" ✓ — ${result.endpoints.length} endpoints, ${result.mappings.length} mappings`)
            }
        }

        // ── Phase 2: Compile & Upsert Workflow SDLs ─────────────────────────
        for (const file of sdlFiles) {
            const filePath = path.join(templatesDir, file)
            const sdl = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
            if (!sdl.name || (!sdl.nodes && !sdl.workflow)) {
                console.log(`[Bootstrap] Skipping ${file} (Not a Workflow SDL)`)
                continue;
            }

            console.log(`[Bootstrap] Compiling workflow: ${sdl.name}...`)

            try {
                const compiled = compileSDLToFlow(sdl)

                const existing = await payload.find({
                    collection: 'workflows',
                    where: { name: { equals: sdl.name } },
                    limit: 1
                })

                let savedDoc: any
                if (existing.docs.length > 0) {
                    savedDoc = await payload.update({
                        collection: 'workflows',
                        id: existing.docs[0].id,
                        data: { ...compiled, status: 'PUBLISHED' } as any
                    })
                } else {
                    savedDoc = await payload.create({
                        collection: 'workflows',
                        data: { ...compiled, status: 'PUBLISHED' } as any
                    })
                }

                results.workflows.push({
                    file,
                    name: sdl.name,
                    workflowId: savedDoc.id,
                    nodesGenerated: compiled.definition.nodes.length,
                    status: 'ok'
                })
            } catch (e: any) {
                results.workflows.push({ file, name: sdl.name, status: 'error', error: e.message })
            }
        }

        return NextResponse.json({
            message: 'Bootstrap complete.',
            summary: {
                blueprintsProcessed: blueprintFiles.length,
                workflowsProcessed: sdlFiles.length,
            },
            results
        })

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
