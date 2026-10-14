"use client"

import * as React from "react"
import { cn } from "@workspace/ui/lib/utils"
import { RadioGroup as RadioGroupPrimitive } from "radix-ui"

// docs/design-system/components/radio-group.md · added with the shadcn CLI, restyled.
// Arrow keys move and select (Radix roving tabindex); the direction follows DirectionProvider.

function RadioGroup({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return (
    <RadioGroupPrimitive.Root
      data-slot="radio-group"
      className={cn("grid w-full gap-3", className)}
      {...props}
    />
  )
}

/** The 20px circle; selected = a 6px primary ring around a card centre. */
function RadioGroupItem({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Item>) {
  return (
    <RadioGroupPrimitive.Item
      data-slot="radio-group-item"
      className={cn(
        "peer relative size-5 shrink-0 rounded-pill border-[1.5px] border-input bg-card outline-none after:absolute after:-inset-3 hover:border-input-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:border-disabled-border disabled:bg-disabled aria-invalid:border-error data-[state=checked]:border-[6px] data-[state=checked]:border-primary",
        className
      )}
      {...props}
    />
  )
}

/**
 * The `card` variant: the whole card is the radio (2px strong border + brand-subtle when
 * selected). Children are the card's content: icon, label, description.
 */
function RadioCard({
  className,
  children,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Item>) {
  return (
    <RadioGroupPrimitive.Item
      data-slot="radio-card"
      className={cn(
        "flex min-h-11 w-full items-start gap-3 rounded-lg border border-border bg-card p-4 text-start outline-none hover:border-input-hover hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60 data-[state=checked]:border-2 data-[state=checked]:border-border-strong data-[state=checked]:bg-brand-subtle data-[state=checked]:p-[calc(--spacing(4)-1px)]",
        className
      )}
      {...props}
    >
      <span
        aria-hidden
        className="mt-0.5 size-5 shrink-0 rounded-pill border-[1.5px] border-input bg-card in-data-[state=checked]:border-[6px] in-data-[state=checked]:border-primary"
      />
      <span className="flex min-w-0 flex-1 gap-3">{children}</span>
    </RadioGroupPrimitive.Item>
  )
}

export { RadioCard, RadioGroup, RadioGroupItem }
