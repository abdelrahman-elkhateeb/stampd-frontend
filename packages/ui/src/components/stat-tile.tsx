import * as React from "react"
import { ArrowDownIcon, ArrowRightIcon, ArrowUpIcon } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"

import { cardVariants } from "@workspace/ui/components/card"
import { Skeleton } from "@workspace/ui/components/skeleton"

// docs/design-system/components/stat-tile.md
type Delta = {
  /** Words carry the meaning ("4 more than avg"); arrow and colour only support them. */
  text: string
  direction: "up" | "down" | "flat"
  tone: "success" | "error" | "neutral"
}

type StatTileProps = {
  label: string
  /** null = not known yet (brand-new company): shows "—". */
  value: number | null
  /** Already formatted with the user's locale (Intl). */
  formattedValue?: string
  formattedTotal?: string
  /** A status dot or category swatch class, e.g. "bg-status-late". */
  markerClassName?: string
  delta?: Delta
  variant?: "default" | "hero"
  loading?: boolean
  /** Whole tile becomes this link (render an <a> or Next <Link> with asChild semantics). */
  link?: (children: React.ReactNode, className: string) => React.ReactNode
  className?: string
}

const DELTA_TONE = {
  success: "bg-success-bg text-success",
  error: "bg-error-bg text-error",
  neutral: "bg-muted text-subtle-foreground",
} as const

const DELTA_ICON = {
  up: ArrowUpIcon,
  down: ArrowDownIcon,
  flat: ArrowRightIcon,
} as const

function StatTile({
  label,
  value,
  formattedValue,
  formattedTotal,
  markerClassName,
  delta,
  variant = "default",
  loading = false,
  link,
  className,
}: StatTileProps) {
  if (loading) {
    return (
      <div
        aria-hidden
        className={cn(cardVariants({ variant: "default" }), "gap-3", className)}
      >
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-9 w-1/3" />
      </div>
    )
  }

  const DeltaIcon = delta ? DELTA_ICON[delta.direction] : null
  const body = (
    <>
      <span className="flex items-center gap-2 text-body-sm font-semibold">
        {markerClassName ? (
          <span
            aria-hidden
            className={cn("size-2 shrink-0 rounded-pill", markerClassName)}
          />
        ) : null}
        {label}
      </span>
      <span className="flex items-baseline gap-1">
        <data value={value ?? ""} className="tabular text-h1 font-black">
          {value === null ? "—" : (formattedValue ?? value)}
        </data>
        {formattedTotal ? (
          <span className="tabular text-h4 text-muted-foreground">
            / {formattedTotal}
          </span>
        ) : null}
      </span>
      {delta && DeltaIcon ? (
        <span
          className={cn(
            "inline-flex h-chip-sm w-fit items-center gap-1 rounded-pill px-2 text-caption font-semibold",
            DELTA_TONE[delta.tone]
          )}
        >
          <DeltaIcon aria-hidden className="size-3" />
          {delta.text}
        </span>
      ) : null}
    </>
  )

  const tileClass = cn(
    cardVariants({
      variant: link ? "interactive" : variant === "hero" ? "hero" : "default",
    }),
    "gap-2",
    variant === "hero" &&
      "border-[1.5px] border-border-strong bg-brand text-brand-foreground shadow-hard",
    className
  )

  return link ? link(body, tileClass) : <div className={tileClass}>{body}</div>
}

export { StatTile, type StatTileProps }
