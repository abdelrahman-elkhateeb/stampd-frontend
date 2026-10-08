import { CheckIcon } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"

// docs/design-system/components/stepper.md · hand-written: shadcn has no stepper.
type Step = { id: string; title: string; subtitle?: string }

function Stepper({
  label,
  steps,
  currentId,
  completed,
  onStepClick,
  stepOf,
}: {
  /** "Import steps" */
  label: string
  steps: Step[]
  currentId: string
  completed: string[]
  /** Completed steps are buttons when this is set (revisit until Confirm). */
  onStepClick?: (id: string) => void
  /** Mobile header: "Step 2 of 4 · Preview". */
  stepOf: (index: number, count: number, title: string) => string
}) {
  const currentIndex = steps.findIndex((step) => step.id === currentId)

  return (
    <>
      <p className="text-body font-bold md:hidden">
        {stepOf(
          currentIndex + 1,
          steps.length,
          steps[currentIndex]?.title ?? ""
        )}
      </p>
      <ol aria-label={label} className="hidden gap-2 md:flex">
        {steps.map((step, index) => {
          const done = completed.includes(step.id)
          const current = step.id === currentId
          const marker = (
            <>
              <span
                aria-hidden
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-pill text-body-sm font-bold",
                  done && "bg-primary text-primary-foreground",
                  current &&
                    "bg-brand text-brand-foreground inset-ring-[1.5px] inset-ring-border-strong",
                  !done &&
                    !current &&
                    "border border-input bg-card text-muted-foreground"
                )}
              >
                {done && !current ? (
                  <CheckIcon className="size-4" strokeWidth={3} />
                ) : (
                  index + 1
                )}
              </span>
              <span className="flex min-w-0 flex-col text-start">
                <span
                  className={cn(
                    "truncate",
                    current ? "font-extrabold" : "font-semibold"
                  )}
                >
                  {step.title}
                </span>
                {step.subtitle ? (
                  <span className="truncate text-caption text-muted-foreground">
                    <bdi>{step.subtitle}</bdi>
                  </span>
                ) : null}
              </span>
            </>
          )
          const className = cn(
            "flex min-w-0 flex-1 items-center gap-2 border-b-[3px] pb-2",
            done || current ? "border-foreground" : "border-border"
          )
          return (
            <li
              key={step.id}
              aria-current={current ? "step" : undefined}
              className="flex min-w-0 flex-1"
            >
              {done && !current && onStepClick ? (
                <button
                  type="button"
                  onClick={() => onStepClick(step.id)}
                  className={cn(
                    className,
                    "rounded-t-sm outline-none hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-solid"
                  )}
                >
                  {marker}
                </button>
              ) : (
                <div className={className}>{marker}</div>
              )}
            </li>
          )
        })}
      </ol>
    </>
  )
}

export { Stepper, type Step }
