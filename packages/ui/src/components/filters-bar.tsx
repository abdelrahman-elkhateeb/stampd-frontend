"use client"

import * as React from "react"
import { cn } from "@workspace/ui/lib/utils"
import { SearchIcon, XIcon } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"

// docs/design-system/components/filters-bar.md · filters apply immediately; the caller
// keeps their values in the URL so views can be bookmarked and shared.
type ActiveFilter = {
  key: string
  label: string
  /** Accessible name of the remove button: "Remove Late filter". */
  removeLabel: string
  onRemove: () => void
  /** Status filters may show their status colours (pass tone classes). */
  className?: string
}

type FiltersBarProps = {
  /** "Filter employees" — the search form's accessible name. */
  label: string
  search?: {
    value: string
    onChange: (value: string) => void
    placeholder: string
    label: string
  }
  /** Filter triggers: outline sm buttons opening selects / date ranges. */
  children?: React.ReactNode
  /** Page actions at the end of the first row (Export CSV…). */
  actions?: React.ReactNode
  active?: ActiveFilter[]
  activeLabel?: string
  onClearAll?: () => void
  clearAllLabel?: string
  /** "16 results", announced politely after changes. */
  resultText?: string
  className?: string
}

const SEARCH_DEBOUNCE_MS = 300

function useDebounced(callback: (value: string) => void, delay: number) {
  const timer = React.useRef<number | undefined>(undefined)
  React.useEffect(() => () => window.clearTimeout(timer.current), [])
  return React.useCallback(
    (value: string) => {
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => callback(value), delay)
    },
    [callback, delay]
  )
}

function SearchField({
  search,
}: {
  search: NonNullable<FiltersBarProps["search"]>
}) {
  const [draft, setDraft] = React.useState(search.value)
  const [synced, setSynced] = React.useState(search.value)
  const commit = useDebounced(search.onChange, SEARCH_DEBOUNCE_MS)
  const inputRef = React.useRef<HTMLInputElement>(null)

  // Follow outside changes (e.g. "Clear all") without fighting the user's typing.
  if (search.value !== synced) {
    setSynced(search.value)
    setDraft(search.value)
  }

  // "/" focuses search, unless the user is already typing somewhere.
  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null
      const typing =
        target?.isContentEditable ||
        ["INPUT", "TEXTAREA", "SELECT"].includes(target?.tagName ?? "")
      if (event.key === "/" && !typing && !event.metaKey && !event.ctrlKey) {
        event.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  return (
    <div className="relative w-full sm:w-65">
      <SearchIcon
        aria-hidden
        className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        ref={inputRef}
        type="search"
        aria-label={search.label}
        placeholder={search.placeholder}
        value={draft}
        onChange={(event) => {
          setDraft(event.target.value)
          commit(event.target.value)
        }}
        className="h-control-sm ps-9 pe-8 [&::-webkit-search-cancel-button]:appearance-none"
      />
      <kbd
        aria-hidden
        className="pointer-events-none absolute end-2.5 top-1/2 -translate-y-1/2 rounded-xs border border-border px-1.5 font-mono text-caption text-muted-foreground"
      >
        /
      </kbd>
    </div>
  )
}

function FiltersBar({
  label,
  search,
  children,
  actions,
  active = [],
  activeLabel = "Active:",
  onClearAll,
  clearAllLabel = "Clear all",
  resultText,
  className,
}: FiltersBarProps) {
  return (
    <form
      role="search"
      aria-label={label}
      onSubmit={(event) => event.preventDefault()}
      className={cn("flex flex-col gap-2", className)}
    >
      <div className="flex flex-wrap items-center gap-2">
        {search ? <SearchField search={search} /> : null}
        {children}
        {actions ? (
          <div className="ms-auto flex items-center gap-2">{actions}</div>
        ) : null}
      </div>
      {active.length > 0 || resultText ? (
        <div className="flex flex-wrap items-center gap-2 text-body-sm">
          {active.length > 0 ? (
            <>
              <span className="font-semibold text-muted-foreground">
                {activeLabel}
              </span>
              {active.map((filter) => (
                <span
                  key={filter.key}
                  className={cn(
                    "inline-flex h-chip-sm items-center gap-1 rounded-pill bg-muted ps-2.5 pe-1 text-caption font-semibold",
                    filter.className
                  )}
                >
                  {filter.label}
                  <button
                    type="button"
                    onClick={filter.onRemove}
                    aria-label={filter.removeLabel}
                    className="inline-flex size-5 items-center justify-center rounded-pill outline-none hover:bg-accent-strong focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-solid"
                  >
                    <XIcon aria-hidden className="size-3" />
                  </button>
                </span>
              ))}
              {onClearAll ? (
                <Button
                  type="button"
                  variant="link"
                  size="xs"
                  onClick={onClearAll}
                >
                  {clearAllLabel}
                </Button>
              ) : null}
            </>
          ) : null}
          {resultText ? (
            <p role="status" className="ms-auto text-muted-foreground">
              {resultText}
            </p>
          ) : null}
        </div>
      ) : null}
    </form>
  )
}

/** An outline filter trigger; shows "Status · 2" and the active style when values are set. */
function FilterTrigger({
  label,
  count = 0,
  className,
  ...props
}: React.ComponentProps<typeof Button> & { label: string; count?: number }) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={cn(
        count > 0 && "border-[1.5px] border-border-strong bg-brand-subtle",
        className
      )}
      {...props}
    >
      {count > 0 ? `${label} · ${count}` : label}
    </Button>
  )
}

export { FiltersBar, FilterTrigger, type ActiveFilter }
