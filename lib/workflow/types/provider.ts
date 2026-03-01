export type ProviderCategory = 'SMS' | 'EMAIL' | 'PAYMENT' | 'KYC' | 'CREDIT_BUREAU' | 'WEBHOOK' | 'CUSTOM'
export type ProviderAuthType = 'NONE' | 'API_KEY' | 'BEARER' | 'BASIC' | 'OAUTH2'
export type ProviderHealthStatus = 'healthy' | 'degraded' | 'down' | 'unknown'

export interface ServiceProvider {
    id: string
    name: string
    slug: string
    category: ProviderCategory
    description?: string
    baseUrl: string
    authType: ProviderAuthType
    secretId?: string              // Reference to a Secret in the vault
    priority: number               // Lower = higher priority for API_SWITCH
    isActive: boolean
    isFallback: boolean
    healthCheckUrl?: string
    healthCheckIntervalMinutes?: number
    defaultHeaders?: Array<{ key: string; value: string }>
    metadata?: Record<string, any> // provider-specific config
    lastHealthStatus?: ProviderHealthStatus
    lastHealthCheckedAt?: string
    createdAt: string
    updatedAt: string
}

export interface ProviderHealthLog {
    id: string
    providerId: string
    status: ProviderHealthStatus
    latencyMs?: number
    statusCode?: number
    errorMessage?: string
    checkedAt: string
}

export interface ProviderGroup {
    /** providers with the same groupTag can be used in API_SWITCH fallback chains */
    groupTag: string
    providers: ServiceProvider[]
}
