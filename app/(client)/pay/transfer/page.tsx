import React, { Suspense } from 'react'
import { Card } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { TransferTabs } from './transfer-tabs'
import { TransferBeneficiaries } from './transfer-beneficiaries'
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Users } from 'lucide-react'

import { api } from '@/lib/api'

export default async function TransferPage() {
    const services = await api.getAllServices()
    const interbankService = services.find(s => s.name.toLowerCase().includes('interbank')) || services.find(s => s.name.toLowerCase().includes('other bank'))
    const internationalService = services.find(s => s.name.toLowerCase().includes('international')) || services.find(s => s.name.toLowerCase().includes('swift'))
    // We can also fetch intrabank if we want to custom render it
    const intrabankService = services.find(s => s.name.toLowerCase().includes('intrabank')) || services.find(s => s.name.toLowerCase().includes('intra'))
    return (
        <div className="container max-w-6xl py-8 space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/client-dashboard" className="p-2 hover:bg-muted rounded-full transition-colors">
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Transfer Funds</h1>
                    <p className="text-muted-foreground text-sm">Send money to local and international accounts</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="hidden lg:block lg:col-span-2 space-y-6">
                    <TransferBeneficiaries />
                </div>

                <div className="lg:col-span-1">
                    <div className="block lg:hidden mb-6">
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="outline" className="w-full h-12 gap-2 border-primary/20 text-primary bg-primary/5 hover:bg-primary/10">
                                    <Users className="h-4 w-4" /> Search Saved Beneficiaries
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="bottom" className="h-[85vh] overflow-y-auto w-full rounded-t-2xl px-4 pb-8">
                                <SheetHeader className="mb-4 text-left">
                                    <SheetTitle>Saved Beneficiaries</SheetTitle>
                                </SheetHeader>
                                <TransferBeneficiaries />
                            </SheetContent>
                        </Sheet>
                    </div>

                    <Suspense fallback={<div className="h-64 flex items-center justify-center text-muted-foreground animate-pulse">Loading forms...</div>}>
                        <TransferTabs
                            interbankService={interbankService || null}
                            internationalService={internationalService || null}
                            intrabankService={intrabankService || null}
                        />
                    </Suspense>
                </div>
            </div>
        </div>
    )
}
