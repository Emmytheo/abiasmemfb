"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { User, Building2, Users, Globe, ShieldAlert } from "lucide-react";

export type ScopeType = "personal" | "business" | "coop" | "global" | "branch" | "support";
export type ScopeId = string;

export interface Scope {
  id: ScopeId;
  type: ScopeType;
  name: string;
  description: string;
  icon: any;
  role?: string;
}

const DEFAULT_CLIENT_SCOPES: Scope[] = [
  {
    id: "personal",
    type: "personal",
    name: "Personal Banking",
    description: "Individual accounts & cards",
    icon: User,
  },
  {
    id: "business",
    type: "business",
    name: "Business & Merchant Suite",
    description: "Corporate accounts, APIs & payroll",
    icon: Building2,
  },
  {
    id: "coop",
    type: "coop",
    name: "Digital Esusu Admin",
    description: "Rotational thrift & union cycles",
    icon: Users,
  },
];

const DEFAULT_ADMIN_SCOPES: Scope[] = [
  {
    id: "global",
    type: "global",
    name: "Global HQ",
    description: "Master Admin Console",
    icon: Globe,
  },
  {
    id: "branch",
    type: "branch",
    name: "Main Branch",
    description: "Branch Operations & Teller",
    icon: Building2,
  },
  {
    id: "support",
    type: "support",
    name: "IT Support",
    description: "System diagnostics & Helpdesk",
    icon: ShieldAlert,
  },
];

interface ScopeContextType {
  activeScopeId: ScopeId;
  activeScope: Scope;
  setScopeId: (id: ScopeId) => void;
  scopes: Scope[];
  isLoadingScopes: boolean;
  refreshScopes: () => Promise<void>;
}

const ScopeContext = createContext<ScopeContextType | undefined>(undefined);

export function ScopeProvider({
  children,
  role = "client",
}: {
  children: React.ReactNode;
  role?: "client" | "admin";
}) {
  const initialList = role === "admin" ? DEFAULT_ADMIN_SCOPES : DEFAULT_CLIENT_SCOPES;
  const storageKey = role === "admin" ? "abia_mfb_admin_scope" : "abia_mfb_client_scope";

  const [scopes, setScopes] = useState<Scope[]>(initialList);
  const [activeScopeId, setActiveScopeId] = useState<ScopeId>(initialList[0].id);
  const [isLoadingScopes, setIsLoadingScopes] = useState(false);

  const loadScopes = useCallback(async () => {
    const baseScopes = role === "admin" ? [...DEFAULT_ADMIN_SCOPES] : [...DEFAULT_CLIENT_SCOPES];

    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(storageKey);
      if (saved && baseScopes.some((s) => s.id === saved)) {
        setActiveScopeId(saved);
      }
    }

    if (role === "client") {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const fullName = user.user_metadata?.full_name || user.user_metadata?.name;
          if (fullName) {
            baseScopes[0] = {
              ...baseScopes[0],
              description: `${fullName} • Personal Ledger`,
            };
          }
          // Enrich business scope name from authenticated /api/client/merchant endpoint
          try {
            const res = await fetch(`/api/client/merchant`, { cache: "no-store" });
            if (res.ok) {
              const data = await res.json();
              if (data.profile?.business_name) {
                baseScopes[1] = {
                  ...baseScopes[1],
                  name: data.profile.business_name,
                  description: "Business & Merchant Suite",
                };
              }
            }
          } catch {
            // keep default business scope label
          }
        }
      } catch {
        // keep default scopes
      }
    }

    setScopes(baseScopes);
  }, [role, storageKey]);

  useEffect(() => {
    loadScopes();
  }, [loadScopes]);

  const setScopeId = (id: ScopeId) => {
    const found = scopes.find((s) => s.id === id);
    if (!found) return;
    setActiveScopeId(id);
    if (typeof window !== "undefined") {
      localStorage.setItem(storageKey, id);
    }
  };

  const activeScope =
    scopes.find((s) => s.id === activeScopeId) ||
    scopes[0] ||
    initialList[0];

  return (
    <ScopeContext.Provider
      value={{
        activeScopeId,
        activeScope,
        setScopeId,
        scopes,
        isLoadingScopes,
        refreshScopes: loadScopes,
      }}
    >
      {children}
    </ScopeContext.Provider>
  );
}

export function useScope() {
  const context = useContext(ScopeContext);
  if (!context) {
    throw new Error("useScope must be used within a ScopeProvider");
  }
  return context;
}
