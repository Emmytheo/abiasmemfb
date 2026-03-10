'use client'

import React, { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Globe2, Wallet, Building2 } from 'lucide-react'
import { ServiceExecutionForm } from '@/components/service-execution-form'
import { Service } from '@/lib/api/types'

interface TransferTabsProps {
    interbankService: Service | null
    internationalService: Service | null
    intrabankService: Service | null
}

export function TransferTabs({ interbankService, internationalService, intrabankService }: TransferTabsProps) {
    const searchParams = useSearchParams()
    const router = useRouter()

    const tabParam = searchParams.get('tab') as string
    const beneficiaryId = searchParams.get('beneficiary') || undefined

    const [activeTab, setActiveTab] = useState(tabParam || 'interbank')

    useEffect(() => {
        if (tabParam) {
            setActiveTab(tabParam)
        }
    }, [tabParam])

    const handleTabChange = (val: string) => {
        setActiveTab(val)
        // Clear params if user manually switches tabs so forms don't randomly pre-fill
        router.replace('/pay/transfer', { scroll: false })
    }

    return (
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
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
                {intrabankService ? (
                    <ServiceExecutionForm service={intrabankService} />
                ) : (
                    <div className="text-center py-8 text-muted-foreground">
                        <Wallet className="mx-auto mb-4 opacity-50" size={48} />
                        <p>Internal transfers are instant and free.</p>
                        <p className="text-xs mt-2">Configure 'intrabank-transfer' service in CMS to enable.</p>
                    </div>
                )}
            </TabsContent>

            <TabsContent value="interbank">
                {interbankService ? (
                    <ServiceExecutionForm service={interbankService} prefillBeneficiaryId={beneficiaryId} />
                ) : (
                    <div className="text-center py-8 text-muted-foreground">
                        <Building2 className="mx-auto mb-4 opacity-50" size={48} />
                        <p>Interbank transfers are not configured.</p>
                    </div>
                )}
            </TabsContent>

            <TabsContent value="international">
                {internationalService ? (
                    <ServiceExecutionForm service={internationalService} prefillBeneficiaryId={beneficiaryId} />
                ) : (
                    <div className="text-center py-8 text-muted-foreground">
                        <Globe2 className="mx-auto mb-4 opacity-50" size={48} />
                        <p>International transfer service not configured.</p>
                    </div>
                )}
            </TabsContent>
        </Tabs>
    )
}
