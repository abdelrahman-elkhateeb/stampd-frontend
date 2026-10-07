"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@workspace/ui/lib/utils"
import { XIcon } from "lucide-react"
import { Dialog as SheetPrimitive } from "radix-ui"

import { Button } from "@workspace/ui/components/button"

// docs/design-system/components/drawer.md · "end" opens from the right in LTR and the left in RTL.
function Sheet({ ...props }: React.ComponentProps<typeof SheetPrimitive.Root>) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />
}

function SheetTrigger({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Trigger>) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}

function SheetClose({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Close>) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />
}

function SheetPortal({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Portal>) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />
}

function SheetOverlay({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Overlay>) {
  return (
    <SheetPrimitive.Overlay
      data-slot="sheet-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-(--scrim) duration-(--dur-base) data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
        className
      )}
      {...props}
    />
  )
}

const sheetVariants = cva(
  [
    "fixed z-50 flex flex-col bg-card text-card-foreground outline-none",
    "duration-(--dur-slower) ease-enter data-open:animate-in data-closed:animate-out data-closed:ease-exit",
    "motion-reduce:data-open:slide-in-from-left-0 motion-reduce:data-open:slide-in-from-right-0",
  ],
  {
    variants: {
      side: {
        // Border and hard side shadow sit on the inline-start edge and flip with --flip.
        end: [
          "inset-y-0 end-0 h-full w-full border-s-[1.5px] border-border-strong",
          "shadow-[calc(-6px*var(--flip))_0_0_0_var(--border-strong)]",
          "data-open:fade-in-0 ltr:data-open:slide-in-from-right-10 rtl:data-open:slide-in-from-left-10",
          "data-closed:fade-out-0 ltr:data-closed:slide-out-to-right-10 rtl:data-closed:slide-out-to-left-10",
        ],
        start: [
          "inset-y-0 start-0 h-full w-full border-e-[1.5px] border-border-strong",
          "data-open:fade-in-0 ltr:data-open:slide-in-from-left-10 rtl:data-open:slide-in-from-right-10",
          "data-closed:fade-out-0 ltr:data-closed:slide-out-to-left-10 rtl:data-closed:slide-out-to-right-10",
        ],
        bottom: [
          "inset-x-0 bottom-0 max-h-[85dvh] rounded-t-xl border-t-[1.5px] border-border-strong",
          "data-open:slide-in-from-bottom-10 data-closed:slide-out-to-bottom-10",
        ],
      },
      size: {
        default: "",
        wide: "",
      },
    },
    compoundVariants: [
      { side: ["end", "start"], size: "default", class: "sm:max-w-110" },
      { side: ["end", "start"], size: "wide", class: "sm:max-w-160" },
    ],
    defaultVariants: { side: "end", size: "default" },
  }
)

function SheetContent({
  className,
  children,
  side = "end",
  size = "default",
  showCloseButton = true,
  closeLabel = "Close",
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> &
  VariantProps<typeof sheetVariants> & {
    showCloseButton?: boolean
    closeLabel?: string
  }) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        data-side={side}
        className={cn(sheetVariants({ side, size }), className)}
        {...props}
      >
        {children}
        {showCloseButton ? (
          <SheetPrimitive.Close data-slot="sheet-close" asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="absolute end-3 top-3"
              aria-label={closeLabel}
            >
              <XIcon aria-hidden />
            </Button>
          </SheetPrimitive.Close>
        ) : null}
      </SheetPrimitive.Content>
    </SheetPortal>
  )
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn(
        "flex items-center gap-3 border-b px-6 py-4 pe-14",
        className
      )}
      {...props}
    />
  )
}

function SheetBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-body"
      className={cn(
        "flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-4",
        className
      )}
      {...props}
    />
  )
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn(
        "mt-auto grid auto-cols-fr grid-flow-col gap-2 border-t px-6 py-4",
        className
      )}
      {...props}
    />
  )
}

function SheetTitle({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn("text-h4 font-bold text-foreground", className)}
      {...props}
    />
  )
}

function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-body-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
}
