import * as React from "react"
import { cn } from "@workspace/ui/lib/utils"

// docs/design-system/components/input.md
const inputClassName = [
  "h-control w-full min-w-0 rounded-md border border-input bg-card px-3.5 text-ui text-foreground",
  "transition-[border-color] duration-(--dur-fast) ease-standard outline-none",
  "placeholder:text-muted-foreground hover:border-input-hover",
  "focus-visible:border-border-strong focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring",
  "aria-invalid:border-[1.5px] aria-invalid:border-error",
  "disabled:cursor-not-allowed disabled:border-disabled-border disabled:bg-disabled disabled:text-disabled-foreground",
  // :read-only also matches buttons and divs, so only style real read-only inputs.
  "[&:is(input,textarea):read-only]:border-dashed [&:is(input,textarea):read-only]:bg-transparent",
  "file:me-3 file:border-0 file:bg-transparent file:text-body-sm file:font-semibold file:text-foreground",
  // Numbers line up and never show the native spinners.
  "[&[type=number]]:tabular [&::-webkit-inner-spin-button]:appearance-none [&[type=number]]:[appearance:textfield]",
  // Email, URL and phone stay LTR inside Arabic layouts, aligned to the field's end.
  "[&[type=email]]:[direction:ltr] [&[type=tel]]:[direction:ltr] [&[type=url]]:[direction:ltr]",
  "rtl:[&[type=email]]:text-end rtl:[&[type=tel]]:text-end rtl:[&[type=url]]:text-end",
].join(" ")

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(inputClassName, className)}
      {...props}
    />
  )
}

export { Input, inputClassName }
