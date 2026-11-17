"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Building2, User, Users } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";

import { ShieldAlert, Globe } from "lucide-react";

const clientScopes = [
  {
    id: "personal",
    name: "Personal Banking",
    description: "Individual accounts & cards",
    icon: User,
  },
  {
    id: "business",
    name: "Acme Corp Ltd.",
    description: "Business & Merchant Suite",
    icon: Building2,
  },
  {
    id: "coop",
    name: "Aba Traders Union",
    description: "Digital Esusu Admin",
    icon: Users,
  },
];

const adminScopes = [
  {
    id: "global",
    name: "Global HQ",
    description: "Master Admin Console",
    icon: Globe,
  },
  {
    id: "branch",
    name: "Main Branch",
    description: "Branch Operations & Teller",
    icon: Building2,
  },
  {
    id: "support",
    name: "IT Support",
    description: "System diagnostics & Helpdesk",
    icon: ShieldAlert,
  },
];

import { useScope } from "@/context/scope-context";

export function ScopeSelector({ role = "client" }: { role?: "client" | "admin" }) {
  const { activeScopeId, setScopeId, scopes } = useScope();
  const activeScope = scopes.find((s) => s.id === activeScopeId) || scopes[0];

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground border shadow-sm mb-4 bg-background"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <activeScope.icon className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-bold">{activeScope.name}</span>
                <span className="truncate text-xs text-muted-foreground">{activeScope.description}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-xl"
            align="start"
            side="bottom"
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wider font-bold">
              Switch Scope
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {scopes.map((scope) => (
              <DropdownMenuItem
                key={scope.id}
                onClick={() => setScopeId(scope.id)}
                className={`gap-3 p-2 cursor-pointer ${
                  activeScopeId === scope.id ? "bg-primary/5" : ""
                }`}
              >
                <div className="flex size-8 items-center justify-center rounded-md border bg-background">
                  <scope.icon className="size-4 text-primary" />
                </div>
                <div className="flex flex-col flex-1">
                  <span className="font-semibold text-sm">{scope.name}</span>
                  <span className="text-xs text-muted-foreground">{scope.description}</span>
                </div>
                {activeScopeId === scope.id && (
                  <Check className="size-4 text-primary ml-auto" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
