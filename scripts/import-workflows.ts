import fs from 'fs'
import path from 'path'
import { getPayload } from 'payload'
import config from '../payload.config'
import { compileSDLToFlow } from '../lib/workflow/sdl'
import { ingestBlueprint, type BlueprintSDL } from '../lib/workflow/blueprint'
import { loadEnvConfig } from '@next/env'

loadEnvConfig(process.cwd())

const run = async () => {
    try {
        console.log("Starting Payload CMS context...")
        const payload = await getPayload({ config })
        const templatesDir = path.join(process.cwd(), 'lib/workflow/templates')
        
        const allFiles = fs.readdirSync(templatesDir)
        const blueprintFiles = allFiles.filter(f => f.endsWith('.blueprint.json'))
        const sdlFiles = allFiles.filter(f => f.endsWith('.sdl.json'))

        // 1. Ingest Blueprints
        for (const file of blueprintFiles) {
            const filePath = path.join(templatesDir, file)
            const blueprint: BlueprintSDL = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
            console.log(`Ingesting blueprint: ${blueprint.name}...`)
            const result = await ingestBlueprint(blueprint, payload)
            console.log(`✓ Blueprint ${blueprint.name} complete: ${result.endpoints.length} endpoints, ${result.mappings.length} mappings`)
        }

        // 2. Ingest Workflows
        for (const file of sdlFiles) {
            const filePath = path.join(templatesDir, file)
            const sdl = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
            if (!sdl.name || (!sdl.nodes && !sdl.workflow && !sdl.steps)) {
                console.log(`Skipping ${file} (Not a Workflow SDL)`)
                continue
            }

            console.log(`Compiling workflow: ${sdl.name}...`)
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
                    console.log(`✓ Updated workflow: ${sdl.name} (ID: ${savedDoc.id})`)
                } else {
                    savedDoc = await payload.create({
                        collection: 'workflows',
                        data: { ...compiled, status: 'PUBLISHED' } as any
                    })
                    console.log(`✓ Created workflow: ${sdl.name} (ID: ${savedDoc.id})`)
                }
            } catch (e: any) {
                console.error(`❌ Error compiling workflow ${sdl.name}:`, e.message)
            }
        }

        console.log("✅ Workflow Sync Complete!")
        process.exit(0)
    } catch (e: any) {
        console.error("❌ Critical Workflow Import Error:", e.message)
        process.exit(1)
    }
}

run()
