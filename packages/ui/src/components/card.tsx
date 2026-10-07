import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@workspace/ui/lib/utils"
import { Slot } from "radix-ui"

// docs/design-system/components/card.md
const cardVariants = cva(
  "group/card flex flex-col gap-4 rounded-lg bg-card p-card text-card-foreground",
  {
    variants: {
      variant: {
        default: "border border-border",
        // One link or button for the whole card, with no other controls inside.
        interactive: [
          "relative border border-border outline-none",
          "transition-[border-color,box-shadow,transform] duration-(--dur-fast) ease-standard",
          "hover:border-border-strong hover:shadow-hard-sm",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring focus-visible:outline-solid",
          "active:translate-x-px active:translate-y-px active:shadow-none",
        ],
        // muted-foreground on brand-subtle fails AA in dark, so descriptions use the full colour.
        selected:
          "border-2 border-border-strong bg-brand-subtle **:data-[slot=card-description]:text-foreground",
        // Max one per screen.
        hero: "border-[1.5px] border-border-strong shadow-hard",
        sunken: "bg-muted",
      },
    },
    defaultVariants: { variant: "default" },
  }
)

function Card({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"section"> &
  VariantProps<typeof cardVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "section"
  return (
    <Comp
      data-slot="card"
      data-variant={variant}
      className={cn(cardVariants({ variant }), className)}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "grid auto-rows-min items-start gap-1 has-data-[slot=card-action]:grid-cols-[1fr_auto]",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"h2">) {
  return (
    <h2
      data-slot="card-title"
      className={cn("text-h4 font-bold", className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="card-description"
      className={cn("text-body-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("flex flex-col gap-3", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex flex-wrap items-center justify-end gap-2", className)}
      {...props}
    />
  )
}

export {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  cardVariants,
}
