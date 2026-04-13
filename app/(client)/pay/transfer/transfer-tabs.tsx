'use client'

import React, { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Globe2, Wallet, Building2 } from 'lucide-react'
import { ServiceExecutionForm } from '@/components/service-execution-form'
import { Service } from '@/lib/api/types'
import { api } from '@/lib/api'

interface TransferTabsProps {
    services: Service[]
}

export function TransferTabs({ services }: TransferTabsProps) {
    const searchParams = useSearchParams()
    const router = useRouter()
    const pathname = useSearchParams().get('x-pathname') || '/pay/transfer' // Fallback for safety

    const tabParam = searchParams.get('tab') as string
    const beneficiaryId = searchParams.get('beneficiary') || undefined

    const [activeTab, setActiveTab] = useState(tabParam || 'interbank')
    const [isResolving, setIsResolving] = useState(false)

    // Resolve services based on new service_intent metadata instead of names
    const intrabankService = services.find(s => s.service_intent === 'transfer_intra') 
    const interbankService = services.find(s => s.service_intent === 'transfer_interbank')
    const internationalService = services.find(s => s.service_intent === 'transfer_international')

    useEffect(() => {
        if (tabParam) {
            setActiveTab(tabParam)
        } else if (beneficiaryId) {
            const resolveTargetTab = async () => {
                setIsResolving(true)
                try {
                    const ben = await api.getBeneficiaryById(beneficiaryId)
                    if (ben) {
                        if (ben.is_international) setActiveTab('international')
                        else if (ben.bank_code === 'abia_mfb' || !ben.bank_code) setActiveTab('internal')
                        else setActiveTab('interbank')
                    }
                } catch (e) {
                    console.error('Failed to resolve beneficiary tab:', e)
                } finally {
                    setIsResolving(false)
                }
            }
            resolveTargetTab()
        }
    }, [tabParam, beneficiaryId])

    const handleTabChange = (val: string) => {
        setActiveTab(val)
        // Keep active tab in URL without full refresh
        const params = new URLSearchParams(searchParams.toString())
        params.set('tab', val)
        router.replace(`?${params.toString()}`, { scroll: false })
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
                    <ServiceExecutionForm 
                        service={intrabankService} 
                        prefillBeneficiaryId={beneficiaryId} 
                    />
                ) : (
                    <div className="text-center py-12 text-muted-foreground border rounded-xl border-dashed bg-accent/5">
                        <Wallet className="mx-auto mb-4 opacity-50 text-primary" size={48} />
                        <h3 className="font-bold text-lg text-foreground">Intra-bank Not Configured</h3>
                        <p className="max-w-xs mx-auto text-sm">Assign the 'transfer_intra' intent to a service in the CMS to enable this tab.</p>
                    </div>
                )}
            </TabsContent>

            <TabsContent value="interbank">
                {interbankService ? (
                    <ServiceExecutionForm 
                        service={interbankService} 
                        prefillBeneficiaryId={beneficiaryId} 
                    />
                ) : (
                    <div className="text-center py-12 text-muted-foreground border rounded-xl border-dashed bg-accent/5">
                        <Building2 className="mx-auto mb-4 opacity-50 text-primary" size={48} />
                        <h3 className="font-bold text-lg text-foreground">Inter-bank Not Configured</h3>
                        <p className="max-w-xs mx-auto text-sm">Assign the 'transfer_interbank' intent to a service in the CMS to enable this tab.</p>
                    </div>
                )}
            </TabsContent>

            <TabsContent value="international">
                {internationalService ? (
                    <ServiceExecutionForm 
                        service={internationalService} 
                        prefillBeneficiaryId={beneficiaryId} 
                    />
                ) : (
                    <div className="text-center py-12 text-muted-foreground border rounded-xl border-dashed bg-accent/5">
                        <Globe2 className="mx-auto mb-4 opacity-50 text-primary" size={48} />
                        <h3 className="font-bold text-lg text-foreground">International Not Configured</h3>
                        <p className="max-w-xs mx-auto text-sm">Assign the 'transfer_international' intent to a service in the CMS to enable this tab.</p>
                    </div>
                )}
            </TabsContent>
        </Tabs>
    )
}
