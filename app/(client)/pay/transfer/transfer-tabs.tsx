'use client'

import React, { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Building2, Globe2, Wallet } from 'lucide-react'
import { InterbankTransferForm } from './interbank-form'
import { InternationalTransferForm } from './international-form'
import { Service } from '@/lib/api/types'
import { ServiceExecutionForm } from '@/components/service-execution-form'

interface TransferTabsProps {
    interbankService: Service | null
    internationalService: Service | null
    intrabankService: Service | null
}

export function TransferTabs({ interbankService, internationalService, intrabankService }: TransferTabsProps) {
    return (
        <Tabs defaultValue="interbank" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="internal" className="flex items-center gap-2">
                    <Wallet size={16} className="hidden sm:inline-block" />
                    <span>Abia MFB</span>
                </TabsTrigger>
                <TabsTrigger value="interbank" className="flex items-center gap-2">
                    <Building2 size={16} className="hidden sm:inline-block" />
                    <span>Other Banks</span>
                </TabsTrigger>
                <TabsTrigger value="international" className="flex items-center gap-2">
                    <Globe2 size={16} className="hidden sm:inline-block" />
                    <span>International</span>
                </TabsTrigger>
            </TabsList>

            <TabsContent value="internal">
                <div className="pt-4">
                    {intrabankService ? (
                        <ServiceExecutionForm service={intrabankService} />
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            <Wallet className="mx-auto mb-4 opacity-50" size={48} />
                            <p>Internal transfers are instant and free.</p>
                            <p className="text-xs mt-2">Configure 'intrabank-transfer' service in CMS to enable.</p>
                        </div>
                    )}
                </div>
            </TabsContent>

            <TabsContent value="interbank">
                <InterbankTransferForm service={interbankService} />
            </TabsContent>

            <TabsContent value="international">
                <InternationalTransferForm service={internationalService} />
            </TabsContent>
        </Tabs>
    )
}
