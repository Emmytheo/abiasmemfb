import fs from 'fs'
import path from 'path'
import { loadEnvConfig } from '@next/env'
loadEnvConfig(process.cwd())

async function importTemplates() {
    const { getPayload } = await import('payload')
    const { default: config } = await import('../payload.config')
    const { compileSDLToFlow } = await import('../lib/workflow/sdl')
    
    const payload = await getPayload({ config })
    const templatesDir = path.join(process.cwd(), 'lib/workflow/templates')
    const files = fs.readdirSync(templatesDir).filter(f => f.endsWith('.json'))

    console.log(`[Importer] Found ${files.length} templates. Starting import...`)

    for (const file of files) {
        try {
            const filePath = path.join(templatesDir, file)
            const sdl = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
            
            console.log(`[Importer] Compiling: ${sdl.name}...`)
            const compiled = compileSDLToFlow(sdl)

            const existing = await payload.find({
                collection: 'workflows',
                where: { name: { equals: sdl.name } },
                limit: 1
            })

            if (existing.docs.length > 0) {
                await payload.update({
                    collection: 'workflows',
                    id: existing.docs[0].id,
                    data: {
                        ...compiled,
                        status: 'PUBLISHED' // Auto-publish on import
                    } as any
                })
                console.log(`[Importer] Updated: ${sdl.name}`)
            } else {
                await payload.create({
                    collection: 'workflows',
                    data: {
                        ...compiled,
                        status: 'PUBLISHED'
                    } as any
                })
                console.log(`[Importer] Created: ${sdl.name}`)
            }
        } catch (e: any) {
            console.error(`[Importer] Failed ${file}: ${e.message}`)
        }
    }

    process.exit(0)
}

importTemplates()
