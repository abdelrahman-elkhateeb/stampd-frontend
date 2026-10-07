import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@workspace/ui/lib/utils"
import { Slot } from "radix-ui"

// docs/design-system/components/badge.md · for statuses use StatusChip, never a badge.
const badgeVariants = cva(
  "tabular inline-flex shrink-0 items-center justify-center font-bold whitespace-nowrap",
  {
    variants: {
      variant: {
        count:
          "h-5 min-w-5 rounded-pill bg-inverse px-1.5 text-caption text-inverse-foreground",
        "count-attention":
          "h-5 min-w-5 rounded-pill bg-status-pending-bg px-1.5 text-caption text-status-pending",
        alert:
          "h-4.5 min-w-4.5 rounded-pill bg-status-absent px-1 text-caption text-card ring-2 ring-background",
        new: "h-5 rounded-pill border border-border-strong bg-brand px-1.5 text-caption text-brand-foreground",
        neutral:
          "h-5 rounded-sm bg-muted px-1.5 text-caption font-semibold text-subtle-foreground",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  }
)

function Badge({
  className,
  variant = "neutral",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"
  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

/**
 * A count in a nav item, tab or the bell. Hidden at zero. aria-hidden: the parent's
 * accessible name must include the count ("Approvals, 7 pending").
 */
function CountBadge({
  count,
  max = 99,
  variant = "count",
  className,
}: {
  count: number
  max?: 9 | 99
  variant?: "count" | "count-attention" | "alert"
  className?: string
}) {
  if (count <= 0) return null
  return (
    <Badge aria-hidden variant={variant} className={className}>
      {count > max ? `${max}+` : count}
    </Badge>
  )
}

export { Badge, badgeVariants, CountBadge }
