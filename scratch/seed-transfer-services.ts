import { getPayload } from 'payload'
import config from '../payload.config'
import { loadEnvConfig } from '@next/env'
import * as fs from 'fs'
import * as path from 'path'

loadEnvConfig(process.cwd())

async function seedTransferServices() {
    const payload = await getPayload({ config })
    
    // Read the transfer_services.sdl.json
    const sdlPath = path.join(process.cwd(), 'lib/workflow/templates/transfer_services.sdl.json')
    const fileContent = fs.readFileSync(sdlPath, 'utf-8')
    const schema = JSON.parse(fileContent)

    console.log(`Seeding Services from ${schema.description}...`)

    // Check if category exists
    let cat = await payload.find({
        collection: 'service-categories',
        where: { slug: { equals: 'transfers' } },
        limit: 1
    })

    let categoryId = cat.docs[0]?.id
    if (!categoryId) {
        const newCat = await payload.create({
            collection: 'service-categories',
            data: {
                name: 'Transfers & Payments',
                slug: 'transfers',
                description: 'Send money internally, to other banks, or internationally.',
                icon: 'ArrowRightLeft',
                status: 'active'
            }
        })
        categoryId = newCat.id
    }

    for (const serviceData of schema.services) {
        // Check if service already exists
        const existing = await payload.find({
            collection: 'services',
            where: { provider_service_code: { equals: serviceData.provider_service_code } },
            limit: 1
        })

        if (existing.docs.length > 0) {
            console.log(`Updating service: ${serviceData.name}`)
            await payload.update({
                collection: 'services',
                id: existing.docs[0].id,
                data: {
                    ...serviceData,
                    category: categoryId
                }
            })
        } else {
            console.log(`Creating service: ${serviceData.name}`)
            await payload.create({
                collection: 'services',
                data: {
                    ...serviceData,
                    category: categoryId
                }
            })
        }
    }

    console.log("Transfer services seeded successfully!")
    process.exit(0)
}

seedTransferServices().catch(err => {
    console.error(err)
    process.exit(1)
})
