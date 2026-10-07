"use client"

import * as React from "react"
import {
  CheckIcon,
  CopyIcon,
  TriangleAlertIcon,
  WifiOffIcon,
} from "lucide-react"

import { cn } from "@workspace/ui/lib/utils"

type ErrorStateVariant = "section" | "inline" | "page" | "offline"

interface ErrorStateProps extends Omit<React.ComponentProps<"div">, "title"> {
  variant?: ErrorStateVariant
  title: React.ReactNode
  body?: React.ReactNode
  /** Support code shown in a copyable chip (always LTR). */
  code?: string
  /** Labels for the code chip; pass translated strings. */
  codeLabels?: { label: string; copy: string; copied: string }
  actions?: React.ReactNode
  status?: 401 | 403 | 404 | 500
}

// docs/design-system/components/error-state.md
function ErrorState({
  variant = "section",
  title,
  body,
  code,
  codeLabels = {
    label: "Support code",
    copy: "Copy support code",
    copied: "Copied",
  },
  actions,
  status,
  className,
  ...props
}: ErrorStateProps) {
  const headingRef = React.useRef<HTMLHeadingElement>(null)

  // Page errors move focus to the heading so screen readers announce what happened.
  React.useEffect(() => {
    if (variant === "page") {
      headingRef.current?.focus()
    }
  }, [variant])

  if (variant === "inline" || variant === "offline") {
    const Icon = variant === "offline" ? WifiOffIcon : TriangleAlertIcon
    return (
      <div
        role="alert"
        data-slot="error-state"
        data-variant={variant}
        className={cn(
          "flex items-center gap-3 rounded-md px-4 py-3 text-body-sm",
          variant === "offline"
            ? "bg-warning-bg text-warning"
            : "bg-error-bg text-error",
          className
        )}
        {...props}
      >
        <Icon aria-hidden className="size-icon shrink-0" />
        <div className="min-w-0 flex-1">
          <span className="font-semibold">{title}</span>
          {body ? <span className="ms-1">{body}</span> : null}
        </div>
        {actions}
      </div>
    )
  }

  const isPage = variant === "page"
  const Heading = isPage ? "h1" : "h2"

  return (
    <div
      role={isPage ? undefined : "alert"}
      data-slot="error-state"
      data-variant={variant}
      data-status={status}
      className={cn(
        "flex flex-col items-center gap-4 text-center",
        isPage ? "mx-auto w-full max-w-120 px-4 py-16" : "px-6 py-8",
        className
      )}
      {...props}
    >
      <span className="flex size-12 items-center justify-center rounded-pill bg-error-bg text-error">
        <TriangleAlertIcon aria-hidden className="size-6" />
      </span>
      <div className="flex flex-col gap-2">
        <Heading
          ref={headingRef}
          tabIndex={isPage ? -1 : undefined}
          className={cn(
            "font-bold text-foreground outline-none",
            isPage ? "text-h1" : "text-h4"
          )}
        >
          {title}
        </Heading>
        {body ? (
          <p className="text-body text-muted-foreground">{body}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {actions}
        </div>
      ) : null}
      {code ? <SupportCode code={code} labels={codeLabels} /> : null}
    </div>
  )
}

function SupportCode({
  code,
  labels,
}: {
  code: string
  labels: { label: string; copy: string; copied: string }
}) {
  const [copied, setCopied] = React.useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard can be blocked; the code is still visible and selectable.
    }
  }

  return (
    <div className="flex items-center gap-2 text-caption text-muted-foreground">
      <span>{labels.label}</span>
      <code
        dir="ltr"
        className="rounded-sm bg-muted px-2 py-0.5 font-mono text-foreground select-all"
      >
        {code}
      </code>
      <button
        type="button"
        onClick={copy}
        aria-label={copied ? labels.copied : labels.copy}
        className="inline-flex size-8 items-center justify-center rounded-sm hover:bg-muted"
      >
        {copied ? (
          <CheckIcon aria-hidden className="size-4" />
        ) : (
          <CopyIcon aria-hidden className="size-4" />
        )}
      </button>
    </div>
  )
}

export { ErrorState, type ErrorStateProps }
