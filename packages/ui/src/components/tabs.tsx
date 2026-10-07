"use client"

import * as React from "react"
import { cn } from "@workspace/ui/lib/utils"
import { Tabs as TabsPrimitive } from "radix-ui"

import { CountBadge } from "@workspace/ui/components/badge"

// docs/design-system/components/tabs.md · page tabs with an underline. For a two-way
// toggle use a segmented control instead.
function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-4", className)}
      {...props}
    />
  )
}

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "flex w-full [scrollbar-width:none] items-end gap-1 overflow-x-auto border-b border-border",
        className
      )}
      {...props}
    />
  )
}

function TabsTrigger({
  className,
  count,
  attention = false,
  children,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger> & {
  /** Shown as a badge; include it in the accessible name ("Corrections, 5"). */
  count?: number
  /** Count of items that need action (pending tint). */
  attention?: boolean
}) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "relative inline-flex h-11 shrink-0 items-center gap-2 rounded-t-sm px-3 text-body font-semibold whitespace-nowrap text-subtle-foreground outline-none",
        "transition-colors duration-(--dur-fast) hover:bg-accent",
        "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring focus-visible:outline-solid",
        "data-[state=active]:font-bold data-[state=active]:text-foreground",
        "after:absolute after:inset-x-0 after:bottom-0 after:h-[2.5px] after:bg-foreground after:opacity-0 data-[state=active]:after:opacity-100",
        "disabled:cursor-not-allowed disabled:text-disabled-foreground disabled:hover:bg-transparent",
        className
      )}
      {...props}
    >
      {children}
      {count !== undefined ? (
        <CountBadge
          count={count}
          variant={attention ? "count-attention" : "count"}
        />
      ) : null}
    </TabsPrimitive.Trigger>
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn(
        "outline-none focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-solid",
        className
      )}
      {...props}
    />
  )
}

export { Tabs, TabsContent, TabsList, TabsTrigger }
