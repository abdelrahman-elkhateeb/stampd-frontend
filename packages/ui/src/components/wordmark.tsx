import { cn } from "@workspace/ui/lib/utils"

// docs/design-system/brand.md
/** The Stampd stamp: brand name on a butter tile, ink edge, hard shadow, tilted. Never mirrored in RTL. */
function Wordmark({
  className,
  children = "Stampd",
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="wordmark"
      className={cn(
        "inline-flex -rotate-3 rounded-md border-[1.5px] border-border-strong bg-brand px-3 py-1 text-h4 font-black text-brand-foreground shadow-hard-sm select-none",
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}

export { Wordmark }
