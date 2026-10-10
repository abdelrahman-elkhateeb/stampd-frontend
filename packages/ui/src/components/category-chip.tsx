import {
  DoorOpenIcon,
  FileClockIcon,
  FileTextIcon,
  HouseIcon,
  PlaneIcon,
  UmbrellaIcon,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"

// docs/design-system/components/category-chip.md · icons from iconography.md.
// Category = what kind of request; never a state (that's StatusChip).
// ponytail: only the `static` variant; filter/dot/event come with the screens that need them.

export const REQUEST_CATEGORIES = [
  "leave",
  "wfh",
  "trip",
  "permission",
  "correction",
] as const
export type RequestCategory = (typeof REQUEST_CATEGORIES)[number]

const CATEGORY_META: Record<
  RequestCategory,
  { icon: LucideIcon; tone: string; flip?: boolean }
> = {
  leave: { icon: UmbrellaIcon, tone: "bg-cat-leave" },
  wfh: { icon: HouseIcon, tone: "bg-cat-wfh" },
  trip: { icon: PlaneIcon, tone: "bg-cat-trip", flip: true },
  permission: { icon: DoorOpenIcon, tone: "bg-cat-permission" },
  correction: { icon: FileClockIcon, tone: "bg-cat-correction" },
}

export function isRequestCategory(value: string): value is RequestCategory {
  return (REQUEST_CATEGORIES as readonly string[]).includes(value)
}

/** Unknown categories fall back to a neutral chip with FileText (request-form-renderer.md). */
function CategoryChip({
  category,
  label,
  className,
}: {
  category: string
  /** The translated type name. */
  label: string
  className?: string
}) {
  const meta = isRequestCategory(category)
    ? CATEGORY_META[category]
    : { icon: FileTextIcon, tone: "bg-muted" }
  const Icon = meta.icon
  return (
    <span
      data-slot="category-chip"
      data-category={category}
      className={cn(
        "inline-flex h-chip w-fit max-w-full shrink-0 items-center gap-1.5 rounded-pill border border-cat-border px-2.5 text-body-sm font-semibold whitespace-nowrap text-cat-foreground",
        meta.tone,
        className
      )}
    >
      <Icon
        aria-hidden
        className={cn("size-4", "flip" in meta && meta.flip && "flip-rtl")}
      />
      <span className="truncate">{label}</span>
    </span>
  )
}

/** The type icon on its category fill, for picker cards and list rows. */
function CategoryIcon({
  category,
  className,
}: {
  category: string
  className?: string
}) {
  const meta = isRequestCategory(category)
    ? CATEGORY_META[category]
    : { icon: FileTextIcon, tone: "bg-muted" }
  const Icon = meta.icon
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-md border border-cat-border text-cat-foreground",
        meta.tone,
        className
      )}
    >
      <Icon
        className={cn("size-5", "flip" in meta && meta.flip && "flip-rtl")}
      />
    </span>
  )
}

export { CategoryChip, CategoryIcon }
