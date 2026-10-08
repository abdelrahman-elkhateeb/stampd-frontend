import * as React from "react"
import { cn } from "@workspace/ui/lib/utils"

import { inputClassName } from "@workspace/ui/components/input"

// docs/design-system/components/textarea.md · same states as Input; dir="auto" for mixed
// Arabic/English reasons.
function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      dir="auto"
      rows={3}
      className={cn(
        inputClassName,
        "h-auto min-h-24 resize-y py-3 leading-(--lh-body-lg)",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
