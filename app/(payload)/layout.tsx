import configPromise from '@payload-config'
import '@payloadcms/next/css'
import type { ServerFunctionClient } from 'payload'
import { handleServerFunctions, RootLayout } from '@payloadcms/next/layouts'
import React from 'react'
import { importMap } from './importMap'

type Args = {
    children: React.ReactNode
}

const serverFunction: ServerFunctionClient = async function (args) {
    'use server'
    return handleServerFunctions({
        ...args,
        config: configPromise,
        importMap,
    })
}

import { Suspense } from 'react'

const Layout = ({ children }: Args) => (
    <Suspense fallback={<div style={{ padding: '20px' }}>Initializing Admin Panel...</div>}>
        <RootLayout config={configPromise} importMap={importMap} serverFunction={serverFunction}>
            {children}
        </RootLayout>
    </Suspense>
)

export default Layout
