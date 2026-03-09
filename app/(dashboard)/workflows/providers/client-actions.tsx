'use client'

import React, { useState } from 'react'
import { Plus, SearchIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function ProviderActions() {
    const router = useRouter()

    const handleNew = () => {
        router.push('/workflows/providers?id=new')
    }

    return (
        <button onClick={handleNew} className="p-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-md transition-colors">
            <Plus size={16} />
        </button>
    )
}
