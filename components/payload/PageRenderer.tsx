import React from 'react'
import { Hero } from './blocks/Hero'
import { Features } from './blocks/Features'

// We map exactly to the slug of the blocks defined in collections/blocks/*
const components: Record<string, React.FC<any>> = {
    'hero': Hero,
    'features': Features,
}

export const PageRenderer = ({ layout }: { layout: any[] }) => {
    if (!layout) return null

    return (
        <div className="payload-page-layout">
            {layout.map((block, index) => {
                const BlockComponent = components[block.blockType]

                if (BlockComponent) {
                    return <BlockComponent key={index} {...block} />
                }

                // Return a visual fallback in development if a block isn't mapped
                return (
                    <div key={index} className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-md my-4 flex items-center justify-center">
                        Unmapped block: {block.blockType}
                    </div>
                )
            })}
        </div>
    )
}
