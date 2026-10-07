import { cn } from "@workspace/ui/lib/utils"

// docs/design-system/components/skeleton.md
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      aria-hidden
      data-slot="skeleton"
      className={cn("skeleton-block rounded-sm", className)}
      {...props}
    />
  )
}

/**
 * Wraps skeleton blocks: announces "Loading {thing}" once, and stays invisible
 * for the first 300 ms so fast loads never flash.
 */
function SkeletonGroup({
  label,
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & { label: string }) {
  return (
    <div
      aria-busy="true"
      className={cn("skeleton-delay", className)}
      {...props}
    >
      <span className="sr-only">{label}</span>
      {children}
    </div>
  )
}

function TableSkeleton({
  rows = 8,
  columns,
  label,
}: {
  rows?: number
  columns: number
  label: string
}) {
  return (
    <SkeletonGroup label={label} className="flex flex-col">
      {Array.from({ length: rows }, (_, row) => (
        <div
          key={row}
          className="flex h-row items-center gap-4 border-b px-cell last:border-b-0"
        >
          {Array.from({ length: columns }, (_, column) => (
            <Skeleton
              key={column}
              className={cn(
                "h-3.5 flex-1",
                column === 0 ? "max-w-48" : "max-w-24"
              )}
            />
          ))}
        </div>
      ))}
    </SkeletonGroup>
  )
}

export { Skeleton, SkeletonGroup, TableSkeleton }
