// Temporary bypass until payload-types is generated
export interface StaticHeader {
    key: string;
    value: string;
    id?: string;
}

export interface ApiEndpoint {
    id: string;
    name: string;
    description?: string;
    provider: string | any; // Can be an ID or hydrated object
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';
    path: string;
    status: 'active' | 'deprecated' | 'draft';
    headers?: StaticHeader[];
    queryParams?: StaticHeader[];
    
    // Auth Overrides
    authOverride?: 'INHERIT' | 'NONE' | 'API_KEY' | 'BEARER' | 'QUERY_PARAM' | 'BODY_FIELD';
    authBodyFieldKey?: string;
    authQueryParamKey?: string;

    // JSON Schema representations
    queryParamsSchema?: Record<string, any>;
    bodySchema?: Record<string, any>;
    
    // How to map response data back to workflow engine output
    responseSchema?: Record<string, any>;
    
    createdAt: string;
    updatedAt: string;
}
