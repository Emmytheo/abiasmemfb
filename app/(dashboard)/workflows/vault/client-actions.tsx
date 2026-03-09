'use client'

import React from 'react'
import { Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function VaultActions() {
    const router = useRouter()

    const handleNew = () => {
        router.push('/workflows/vault?id=new')
    }

    return (
        <button onClick={handleNew} className="p-1.5 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 rounded-md transition-colors">
            <Plus size={16} />
        </button>
    )
}
