import * as React from "react"
import { cn } from "@workspace/ui/lib/utils"
import { InboxIcon, SearchIcon, type LucideIcon } from "lucide-react"

// docs/design-system/components/empty-state.md
type EmptyStateProps = {
  variant?: "first-use" | "caught-up" | "filtered" | "no-data" | "compact"
  title: string
  body?: string
  action?: React.ReactNode
  /** Icon for no-data (defaults to Inbox). */
  icon?: LucideIcon
  headingLevel?: 2 | 3 | 4
  className?: string
}

/** Sparkle doodle for first-use and caught-up only; identical in both themes, never mirrored. */
function SparkleDoodle() {
  return (
    <svg aria-hidden viewBox="0 0 120 96" className="h-24 w-30" fill="none">
      <rect
        x="22"
        y="26"
        width="76"
        height="52"
        rx="10"
        fill="var(--illo-paper)"
        stroke="var(--illo-ink)"
        strokeWidth="2"
      />
      <rect
        x="34"
        y="40"
        width="40"
        height="6"
        rx="3"
        fill="var(--cat-leave)"
        stroke="var(--illo-ink)"
        strokeWidth="2"
      />
      <rect
        x="34"
        y="54"
        width="28"
        height="6"
        rx="3"
        fill="var(--illo-yellow)"
        stroke="var(--illo-ink)"
        strokeWidth="2"
      />
      <path
        d="M92 10 L95 19 L104 22 L95 25 L92 34 L89 25 L80 22 L89 19 Z"
        fill="var(--illo-yellow)"
        stroke="var(--illo-ink)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle
        cx="18"
        cy="18"
        r="4"
        fill="var(--illo-coral)"
        stroke="var(--illo-ink)"
        strokeWidth="2"
      />
    </svg>
  )
}

function EmptyState({
  variant = "no-data",
  title,
  body,
  action,
  icon: Icon = InboxIcon,
  headingLevel = 3,
  className,
}: EmptyStateProps) {
  const Heading = `h${headingLevel}` as const

  if (variant === "compact") {
    return (
      <div className={cn("flex flex-col gap-1 py-4 text-body-sm", className)}>
        <Heading className="font-semibold text-foreground">{title}</Heading>
        {body ? <p className="text-muted-foreground">{body}</p> : null}
        {action}
      </div>
    )
  }

  const visual =
    variant === "first-use" || variant === "caught-up" ? (
      <SparkleDoodle />
    ) : (
      <span className="flex size-14 items-center justify-center rounded-pill bg-muted text-subtle-foreground">
        {variant === "filtered" ? (
          <SearchIcon aria-hidden className="size-6" />
        ) : (
          <Icon aria-hidden className="size-6" />
        )}
      </span>
    )

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-4 px-6 py-10 text-center",
        className
      )}
    >
      {visual}
      <div className="flex max-w-70 flex-col gap-2">
        <Heading className="text-h3 font-bold text-foreground">{title}</Heading>
        {body ? (
          <p className="text-body text-muted-foreground">{body}</p>
        ) : null}
      </div>
      {action}
    </div>
  )
}

export { EmptyState, type EmptyStateProps }
