"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { useScope } from "@/context/scope-context";

const SCOPE_ACCENTS: Record<string, { dot: string; badge: string }> = {
  personal: { dot: "bg-emerald-500", badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
  business: { dot: "bg-violet-500", badge: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20" },
  coop: { dot: "bg-amber-500", badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" },
  global: { dot: "bg-emerald-500", badge: "bg-primary/10 text-primary border-primary/20" },
  branch: { dot: "bg-sky-500", badge: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20" },
  support: { dot: "bg-amber-500", badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" },
};

export function ScopeSelector({ role = "client" }: { role?: "client" | "admin" }) {
  const { activeScopeId, setScopeId, scopes } = useScope();
  const activeScope = scopes.find((s) => s.id === activeScopeId) || scopes[0];
  const accent = SCOPE_ACCENTS[activeScope.type] || SCOPE_ACCENTS.global;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground border border-border/80 rounded-xl shadow-sm mb-3 bg-card/90 hover:border-primary/35 transition-all"
            >
              <div className={`relative flex aspect-square size-8 items-center justify-center rounded-lg border ${accent.badge}`}>
                <activeScope.icon className="size-4" />
                <span className={`absolute -top-0.5 -right-0.5 size-2 rounded-full ${accent.dot} ring-2 ring-card`} />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-black text-xs">{activeScope.name}</span>
                <span className="truncate text-[11px] text-muted-foreground">{activeScope.description}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4 text-muted-foreground" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-60 rounded-2xl p-1.5 shadow-xl"
            align="start"
            side="bottom"
            sideOffset={6}
          >
            <DropdownMenuLabel className="text-[10px] text-muted-foreground uppercase tracking-[0.14em] font-black px-2.5 py-1.5">
              {role === "admin" ? "Operations Scope" : "Banking Workspace"}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {scopes.map((scope) => {
              const scAccent = SCOPE_ACCENTS[scope.type] || SCOPE_ACCENTS.global;
              const isSelected = activeScopeId === scope.id;
              return (
                <DropdownMenuItem
                  key={scope.id}
                  onClick={() => setScopeId(scope.id)}
                  className={`gap-3 p-2.5 rounded-xl cursor-pointer transition-colors ${
                    isSelected ? "bg-primary/10" : ""
                  }`}
                >
                  <div className={`flex size-8 items-center justify-center rounded-lg border ${scAccent.badge}`}>
                    <scope.icon className="size-4" />
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="font-bold text-xs truncate">{scope.name}</span>
                    <span className="text-[11px] text-muted-foreground truncate">{scope.description}</span>
                  </div>
                  {isSelected && <Check className="size-4 text-primary ml-auto shrink-0" />}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
