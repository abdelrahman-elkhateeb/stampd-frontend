"use client"

import { ChevronRightIcon, FileTextIcon, PlusIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import {
  parseAsArrayOf,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from "nuqs"

import { DateRangeField } from "@/components/pickers"
import { companyDate } from "@/features/attendance/rules"
import { Status, useStatusLabel } from "@/components/status"
import { Link } from "@/i18n/navigation"
import { isPlainDate } from "@/lib/format"
import { DEMO_USER } from "@/lib/demo-user"
import { useFormat } from "@/lib/use-format"
import { Button } from "@workspace/ui/components/button"
import { CategoryIcon } from "@workspace/ui/components/category-chip"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { EmptyState } from "@workspace/ui/components/empty-state"
import { FiltersBar, FilterTrigger } from "@workspace/ui/components/filters-bar"
import { Skeleton, SkeletonGroup } from "@workspace/ui/components/skeleton"
import { REQUEST_STATUSES } from "@workspace/ui/components/status-chip"

import { DEMO_REQUEST_TYPES } from "./demo-data"
import { useRequestText } from "./request-text"
import { queryRequests, submittedAt } from "./rules"
import { useRequests } from "./store"

const TYPE_KEYS = DEMO_REQUEST_TYPES.map((type) => type.key)

// Status filters keep their status colours (filters-bar.md).
const STATUS_TONES = {
  pending: "bg-status-pending-bg text-status-pending",
  approved: "bg-status-approved-bg text-status-approved",
  rejected: "bg-status-rejected-bg text-status-rejected",
  withdrawn: "bg-status-withdrawn-bg text-status-withdrawn",
  "cancel-requested":
    "bg-status-cancel-requested-bg text-status-cancel-requested",
  cancelled: "bg-status-cancelled-bg text-status-cancelled",
} as const

export function RequestsPage() {
  const t = useTranslations("requests")
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h1 className="text-h2 font-bold">{t("title")}</h1>
          <p className="text-muted-foreground">{t("description")}</p>
        </div>
        <Button asChild>
          <Link href="/requests/new">
            <PlusIcon aria-hidden />
            {t("new")}
          </Link>
        </Button>
      </div>
      <RequestsList />
    </div>
  )
}

function RequestsList() {
  const t = useTranslations("requests")
  const tAll = useTranslations()
  const format = useFormat()
  const statusLabel = useStatusLabel()
  const text = useRequestText()
  const requests = useRequests()
  const [filters, setFilters] = useQueryStates(
    {
      type: parseAsArrayOf(parseAsStringLiteral(TYPE_KEYS)).withDefault([]),
      status: parseAsArrayOf(
        parseAsStringLiteral(REQUEST_STATUSES)
      ).withDefault([]),
      from: parseAsString,
      to: parseAsString,
    },
    { history: "replace", clearOnDefault: true }
  )
  const from = filters.from && isPlainDate(filters.from) ? filters.from : null
  const to = filters.to && isPlainDate(filters.to) ? filters.to : null

  if (!requests) {
    return (
      <SkeletonGroup label={t("loading")} className="flex flex-col gap-2">
        {[0, 1, 2, 3].map((row) => (
          <Skeleton key={row} className="h-20 rounded-lg" />
        ))}
      </SkeletonGroup>
    )
  }

  const rows = queryRequests(requests, DEMO_REQUEST_TYPES, DEMO_USER.id, {
    types: filters.type,
    statuses: filters.status,
    from,
    to,
  })
  const filtersActive =
    filters.type.length > 0 || filters.status.length > 0 || Boolean(from)

  function clearAll() {
    void setFilters({ type: null, status: null, from: null, to: null })
  }

  function toggle(key: "type" | "status", value: string, on: boolean) {
    const current: string[] = filters[key]
    void setFilters({
      [key]: on
        ? [...current, value]
        : current.filter((item) => item !== value),
    })
  }

  const range = from && to ? format.dayRange(from, to) : null

  return (
    <div className="flex flex-col gap-4">
      <FiltersBar
        label={t("filterLabel")}
        active={[
          ...filters.type.map((type) => ({
            key: `type-${type}`,
            label: text.typeLabel(type),
            removeLabel: tAll("filters.remove", {
              name: text.typeLabel(type),
            }),
            onRemove: () => toggle("type", type, false),
          })),
          ...filters.status.map((status) => ({
            key: status,
            label: statusLabel(status),
            removeLabel: tAll("filters.remove", { name: statusLabel(status) }),
            onRemove: () => toggle("status", status, false),
            className: STATUS_TONES[status],
          })),
          ...(range
            ? [
                {
                  key: "dates",
                  label: range,
                  removeLabel: tAll("filters.remove", { name: range }),
                  onRemove: () => void setFilters({ from: null, to: null }),
                },
              ]
            : []),
        ]}
        activeLabel={tAll("filters.active")}
        clearAllLabel={tAll("filters.clearAll")}
        onClearAll={clearAll}
        resultText={
          filtersActive
            ? tAll("filters.results", { count: rows.length })
            : undefined
        }
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <FilterTrigger
              label={t("filters.type")}
              count={filters.type.length}
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {TYPE_KEYS.map((type) => (
              <DropdownMenuCheckboxItem
                key={type}
                checked={filters.type.includes(type)}
                onCheckedChange={(on) => toggle("type", type, on)}
                onSelect={(event) => event.preventDefault()}
              >
                {text.typeLabel(type)}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <FilterTrigger
              label={t("filters.status")}
              count={filters.status.length}
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {REQUEST_STATUSES.map((status) => (
              <DropdownMenuCheckboxItem
                key={status}
                checked={filters.status.includes(status)}
                onCheckedChange={(on) => toggle("status", status, on)}
                onSelect={(event) => event.preventDefault()}
              >
                {statusLabel(status)}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="w-full sm:w-64 [&_label]:sr-only">
          <DateRangeField
            label={t("filters.dates")}
            value={{ from, to }}
            onChange={(value) => {
              // Apply once the range is whole; a start alone keeps the old filter.
              if (value.from && value.to)
                void setFilters({ from: value.from, to: value.to })
            }}
          />
        </div>
      </FiltersBar>

      {rows.length === 0 ? (
        filtersActive ? (
          <EmptyState
            variant="filtered"
            title={t("empty.filteredTitle")}
            body={t("empty.filteredBody")}
            action={
              <Button variant="outline" size="sm" onClick={clearAll}>
                {tAll("common.clearFilters")}
              </Button>
            }
          />
        ) : (
          <EmptyState
            variant="first-use"
            icon={FileTextIcon}
            title={t("empty.title")}
            body={t("empty.body")}
            action={
              <Button asChild>
                <Link href="/requests/new">{t("new")}</Link>
              </Button>
            }
          />
        )
      ) : (
        <ul
          aria-label={t("listLabel")}
          className="divide-y overflow-hidden rounded-lg border bg-card"
        >
          {rows.map((request) => (
            <li key={request.id}>
              <Link
                href={`/requests/${request.id}`}
                className="flex min-h-11 items-center gap-3 px-4 py-3 outline-none hover:bg-accent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
              >
                <CategoryIcon
                  category={
                    DEMO_REQUEST_TYPES.find((type) => type.key === request.type)
                      ?.category ?? ""
                  }
                />
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate text-body font-bold">
                    {text.title(request)}
                  </span>
                  <span className="truncate text-body-sm text-muted-foreground">
                    {text.when(request)}
                  </span>
                  <span className="text-caption text-muted-foreground">
                    {t("submittedOn", {
                      date: format.day(
                        companyDate(
                          new Date(submittedAt(request)),
                          DEMO_USER.company.timezone
                        )
                      ),
                    })}
                  </span>
                </span>
                <Status status={request.status} size="sm" />
                <ChevronRightIcon
                  aria-hidden
                  className="flip-rtl size-4 shrink-0 text-subtle-foreground"
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
