"use client"

import * as React from "react"
import { cn } from "@workspace/ui/lib/utils"
import { Switch as SwitchPrimitive } from "radix-ui"

// docs/design-system/components/switch.md · takes effect immediately; inside a form with
// a Save button, use a Checkbox instead.
function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer group/switch relative inline-flex h-[26px] w-11 shrink-0 items-center rounded-pill p-[3px] outline-none",
        "transition-colors duration-(--dur-fast)",
        "border border-input bg-accent-strong data-[state=checked]:border-primary data-[state=checked]:bg-primary",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring focus-visible:outline-solid",
        "disabled:cursor-not-allowed disabled:border-disabled-border disabled:bg-disabled-border",
        // A 44px touch target around the 26px track.
        "after:absolute after:inset-x-0 after:-inset-y-[9px]",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block size-[18px] rounded-pill border border-input bg-card",
          "transition-transform duration-(--dur-fast) ease-standard",
          "data-[state=checked]:size-5 data-[state=checked]:translate-x-[16px] data-[state=checked]:border-0 data-[state=checked]:bg-brand rtl:data-[state=checked]:-translate-x-[16px]",
          "group-disabled/switch:border-disabled-border group-disabled/switch:bg-disabled"
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
