import React from 'react'
import { Card } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { TransferTabs } from './transfer-tabs'

import { api } from '@/lib/api'

export default async function TransferPage() {
    const services = await api.getAllServices()
    const interbankService = services.find(s => s.name.toLowerCase().includes('interbank')) || services.find(s => s.name.toLowerCase().includes('other bank'))
    const internationalService = services.find(s => s.name.toLowerCase().includes('international')) || services.find(s => s.name.toLowerCase().includes('swift'))
    // We can also fetch intrabank if we want to custom render it
    const intrabankService = services.find(s => s.name.toLowerCase().includes('intrabank')) || services.find(s => s.name.toLowerCase().includes('intra'))
    return (
        <div className="container max-w-2xl py-8 space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/client-dashboard" className="p-2 hover:bg-muted rounded-full transition-colors">
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Transfer Funds</h1>
                    <p className="text-muted-foreground text-sm">Send money to local and international accounts</p>
                </div>
            </div>

            <Card className="p-6">
                <TransferTabs
                    interbankService={interbankService || null}
                    internationalService={internationalService || null}
                    intrabankService={intrabankService || null}
                />
            </Card>
        </div>
    )
}
