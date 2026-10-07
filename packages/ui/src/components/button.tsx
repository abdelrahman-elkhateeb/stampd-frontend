"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@workspace/ui/lib/utils"
import { Loader2Icon, type LucideIcon } from "lucide-react"
import { Slot } from "radix-ui"

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"

// docs/design-system/components/button.md
const buttonVariants = cva(
  [
    "group/button relative inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap select-none",
    "rounded-pill border border-transparent font-semibold outline-none",
    "transition-[background-color,border-color,box-shadow,transform] duration-(--dur-fast) ease-standard",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring focus-visible:outline-solid",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-icon",
    // Disabled: stays focusable (aria-disabled) so the reason can be read out.
    "aria-disabled:cursor-not-allowed aria-disabled:border-disabled-border aria-disabled:bg-disabled aria-disabled:text-disabled-foreground aria-disabled:shadow-none aria-disabled:active:translate-none",
    "disabled:cursor-not-allowed disabled:border-disabled-border disabled:bg-disabled disabled:text-disabled-foreground disabled:shadow-none",
    "aria-busy:cursor-progress",
  ],
  {
    variants: {
      variant: {
        brand:
          "border-[1.5px] border-border-strong bg-brand text-brand-foreground shadow-hard hover:bg-brand-hover active:translate-x-0.5 active:translate-y-0.5 active:shadow-hard-sm",
        default:
          "bg-primary text-primary-foreground hover:bg-primary-hover active:translate-y-px",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary-hover active:translate-y-px",
        outline:
          "border-input bg-card text-foreground hover:border-border-strong hover:bg-accent active:translate-y-px aria-expanded:bg-accent",
        ghost:
          "text-foreground hover:bg-accent active:bg-accent-strong aria-expanded:bg-accent",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive-hover active:translate-y-px",
        link: "h-auto rounded-none px-0 text-foreground underline decoration-[1.5px] underline-offset-4 hover:decoration-2",
      },
      size: {
        hero: "h-14 px-7 text-body-lg font-bold",
        default: "h-control px-6 text-ui compact:px-4",
        sm: "h-control-sm px-5 text-body compact:px-4",
        // Row actions: the visible pill is small, the touch target is padded to 44px.
        xs: "h-control-xs px-3 text-body-sm after:absolute after:-inset-x-1 after:-inset-y-2 after:content-['']",
        icon: "size-control",
        "icon-sm": "size-control-sm",
        "icon-xs":
          "size-control-xs after:absolute after:-inset-2 after:content-[''] [&_svg:not([class*='size-'])]:size-4",
      },
    },
    compoundVariants: [{ variant: "link", class: "h-auto px-0" }],
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
    /** Shows a spinner, keeps the width and blocks double submits. */
    loading?: boolean
    /** Present-tense label while loading, e.g. "Checking in…". */
    loadingLabel?: string
    leadingIcon?: LucideIcon
    trailingIcon?: LucideIcon
    /** Directional trailing icons (arrows, chevrons) mirror in RTL. */
    flipTrailingIcon?: boolean
    /** Why the button can't be used. Keeps it focusable and explains in a tooltip. */
    disabledReason?: string
  }

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  loading = false,
  loadingLabel,
  leadingIcon: LeadingIcon,
  trailingIcon: TrailingIcon,
  flipTrailingIcon = false,
  disabledReason,
  disabled,
  onClick,
  children,
  ...props
}: ButtonProps) {
  const reasonId = React.useId()
  const Comp = asChild ? Slot.Root : "button"
  const blocked = Boolean(disabledReason) || loading

  const content = asChild ? (
    children
  ) : (
    <>
      {loading ? (
        <Loader2Icon
          aria-hidden
          className="animate-spin motion-reduce:animate-none"
        />
      ) : LeadingIcon ? (
        <LeadingIcon aria-hidden />
      ) : null}
      {loading && loadingLabel ? loadingLabel : children}
      {TrailingIcon && !loading ? (
        <TrailingIcon
          aria-hidden
          className={cn(flipTrailingIcon && "flip-rtl")}
        />
      ) : null}
    </>
  )

  const button = (
    <Comp
      {...props}
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={disabled}
      aria-disabled={disabledReason ? true : undefined}
      aria-describedby={disabledReason ? reasonId : props["aria-describedby"]}
      aria-busy={loading || undefined}
      onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
        if (blocked) {
          event.preventDefault()
          return
        }
        onClick?.(event)
      }}
    >
      {content}
    </Comp>
  )

  if (!disabledReason) {
    return button
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent id={reasonId}>{disabledReason}</TooltipContent>
    </Tooltip>
  )
}

export { Button, buttonVariants, type ButtonProps }
