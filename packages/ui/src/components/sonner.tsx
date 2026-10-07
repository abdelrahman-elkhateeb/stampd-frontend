"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, toast, type ToasterProps } from "sonner"
import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"

// docs/design-system/components/toast.md · inverted surface, status circle, ≤ 2 lines.
const circle =
  "flex size-6 items-center justify-center rounded-pill [&_svg]:size-3.5"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      visibleToasts={3}
      gap={8}
      offset={24}
      mobileOffset={16}
      className="toaster group"
      icons={{
        success: (
          <span
            className={`${circle} bg-status-present-bg text-status-present`}
          >
            <CircleCheckIcon />
          </span>
        ),
        info: (
          <span className={`${circle} bg-info-bg text-info`}>
            <InfoIcon />
          </span>
        ),
        warning: (
          <span className={`${circle} bg-warning-bg text-warning`}>
            <TriangleAlertIcon />
          </span>
        ),
        error: (
          <span className={`${circle} bg-status-absent-bg text-status-absent`}>
            <OctagonXIcon />
          </span>
        ),
        loading: (
          <span
            className={`${circle} bg-inverse-muted text-inverse-foreground`}
          >
            <Loader2Icon className="animate-spin motion-reduce:animate-none" />
          </span>
        ),
      }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "flex w-full items-center gap-3 rounded-lg border border-inverse-border bg-inverse py-3 ps-4 pe-3 text-body text-inverse-foreground shadow-pop sm:w-95",
          title: "line-clamp-2 font-semibold",
          description: "text-body-sm text-inverse-muted",
          actionButton:
            "ms-auto h-control-xs shrink-0 rounded-pill border border-border-strong bg-brand px-3 text-body-sm font-semibold text-brand-foreground",
          cancelButton:
            "ms-auto h-control-xs shrink-0 rounded-pill border border-inverse-border px-3 text-body-sm font-semibold text-inverse-foreground",
          closeButton: "text-inverse-foreground",
        },
      }}
      {...props}
    />
  )
}

/** Timings from the spec: 5 s, 8 s with an action, errors stay until dismissed. */
const notify = {
  success: (message: string, action?: { label: string; onClick: () => void }) =>
    toast.success(message, { action, duration: action ? 8000 : 5000 }),
  info: (message: string) => toast.info(message, { duration: 5000 }),
  error: (message: string, retry?: { label: string; onClick: () => void }) =>
    toast.error(message, {
      action: retry,
      duration: Infinity,
      closeButton: true,
    }),
  progress: <T,>(
    promise: Promise<T>,
    messages: { loading: string; success: string; error: string }
  ) => toast.promise(promise, messages),
}

export { notify, Toaster }
