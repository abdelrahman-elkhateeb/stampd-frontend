"use client"

import { CheckIcon, ChevronRightIcon, XIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { useSyncExternalStore } from "react"

import { Link } from "@/i18n/navigation"
import { Button } from "@workspace/ui/components/button"
import { Card } from "@workspace/ui/components/card"
import { cn } from "@workspace/ui/lib/utils"

// docs/design-system/components/setup-checklist.md · reused on the HR dashboard (FE-13).

type StepId = "settings" | "holidays" | "leaveTypes" | "employees" | "invites"

// ponytail: demo progress until done-ness comes from company data (settings saved, ≥ 1 holiday …).
const STEPS: { id: StepId; href: string; done: boolean }[] = [
  { id: "settings", href: "/settings", done: true },
  { id: "holidays", href: "/settings/holidays", done: false },
  { id: "leaveTypes", href: "/settings/leave-types", done: false },
  { id: "employees", href: "/employees", done: false },
  { id: "invites", href: "/employees", done: false },
]

// ponytail: kept per browser; the spec stores dismissal server-side for the whole company.
const DISMISSED_KEY = "stampd.setupChecklist.dismissed"
const listeners = new Set<() => void>()
let hiddenThisVisit = false

function readDismissed() {
  try {
    return localStorage.getItem(DISMISSED_KEY) === "1"
  } catch {
    return false
  }
}

function dismiss() {
  try {
    localStorage.setItem(DISMISSED_KEY, "1")
  } catch {
    // Storage blocked: the card just hides until the next visit.
  }
  hiddenThisVisit = true
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function SetupChecklist() {
  const t = useTranslations("setup")
  const dismissed = useSyncExternalStore(
    subscribe,
    () => hiddenThisVisit || readDismissed(),
    // The server can't know, so the card renders and hides after hydration if dismissed.
    () => false
  )
  const done = STEPS.filter((step) => step.done).length

  if (dismissed || done === STEPS.length) return null

  return (
    <Card variant="hero" aria-labelledby="setup-title" className="gap-5">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <h2 id="setup-title" className="text-h3 font-bold">
            {t("title")}
          </h2>
          <p className="text-body text-muted-foreground">
            {t("progress", { done, total: STEPS.length })}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={t("dismiss")}
          onClick={dismiss}
        >
          <XIcon aria-hidden />
        </Button>
      </div>

      <div
        role="progressbar"
        aria-label={t("title")}
        aria-valuemin={0}
        aria-valuemax={STEPS.length}
        aria-valuenow={done}
        aria-valuetext={t("valueText", { done, total: STEPS.length })}
        className="h-2.5 overflow-hidden rounded-pill bg-muted shadow-[inset_0_0_0_1px_var(--border-strong)]"
      >
        <div
          className="h-full rounded-pill border-e-[1.5px] border-border-strong bg-brand shadow-[inset_0_0_0_1px_var(--border-strong)]"
          style={{ width: `${(done / STEPS.length) * 100}%` }}
        />
      </div>

      <ul className="-mx-2 flex flex-col">
        {STEPS.map((step) => (
          <li key={step.id}>
            <Link
              href={step.href}
              aria-label={t(step.done ? "stepDone" : "stepTodo", {
                step: t(`steps.${step.id}.title`),
              })}
              className="flex min-h-13 items-center gap-3 rounded-md px-2 py-2 outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span
                aria-hidden
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-pill",
                  step.done
                    ? "bg-primary text-primary-foreground"
                    : "border-[1.5px] border-input"
                )}
              >
                {step.done ? (
                  <CheckIcon className="size-3.5" strokeWidth={3} />
                ) : null}
              </span>
              <span aria-hidden className="min-w-0 flex-1">
                <span className="block text-body font-bold">
                  {t(`steps.${step.id}.title`)}
                </span>
                <span className="block text-body-sm text-muted-foreground">
                  {t(`steps.${step.id}.subtitle`)}
                </span>
              </span>
              <ChevronRightIcon
                aria-hidden
                className="flip-rtl size-5 shrink-0 text-muted-foreground"
              />
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  )
}
