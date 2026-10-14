"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import {
  CalendarOffIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react"
import { useTranslations } from "next-intl"
import { parseAsInteger, useQueryState } from "nuqs"
import { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod"

import { TextField, useFieldError } from "@/components/form-fields"
import { DateRangeField } from "@/components/pickers"
import { addDays } from "@/features/attendance/rules"
import { useRequestTypeLabel } from "@/features/requests/request-text"
import { Link } from "@/i18n/navigation"
import { codeErrorMap, showProblem } from "@/lib/forms"
import { useFormat } from "@/lib/use-format"
import { Button } from "@workspace/ui/components/button"
import { Card } from "@workspace/ui/components/card"
import { ConfirmDialog } from "@workspace/ui/components/confirm-dialog"
import type {
  DateRangeValue,
  Holiday,
  PlainDate,
} from "@workspace/ui/components/date-picker"
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { EmptyState } from "@workspace/ui/components/empty-state"
import { FieldGroup } from "@workspace/ui/components/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { notify } from "@workspace/ui/components/sonner"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"

import { removeHoliday, saveHoliday, type AffectedRequest } from "./actions"
import type { HolidayItem } from "./settings-data"

const HolidayBody = z.object({
  dates: z.object(
    { from: z.string(), to: z.string().nullable() },
    { error: "REQUIRED" }
  ),
  name: z.string().trim().min(1).max(100),
})
type HolidayInput = { dates: DateRangeValue | null; name: string }

/** Each day of each holiday, for the date pickers. */
export function holidayDays(holidays: HolidayItem[]): Holiday[] {
  return holidays.flatMap((holiday) => {
    const days: Holiday[] = []
    for (
      let day = holiday.startDate;
      day <= holiday.endDate;
      day = addDays(day, 1)
    )
      days.push({ date: day, name: holiday.name })
    return days
  })
}

export function HolidaysPage({
  holidays,
  year,
  thisYear,
}: {
  holidays: HolidayItem[]
  year: number
  thisYear: number
}) {
  const t = useTranslations("settings.holidays")
  const format = useFormat()
  // The server reads the year, so changing it re-renders the list.
  const [, setYear] = useQueryState(
    "year",
    parseAsInteger.withOptions({ shallow: false, history: "replace" })
  )
  // null = closed, "new" = add, otherwise the holiday being edited.
  const [editing, setEditing] = useState<HolidayItem | "new" | null>(null)
  const [deleting, setDeleting] = useState<HolidayItem | null>(null)
  // Approved requests on a holiday just saved: shown, never changed.
  const [impact, setImpact] = useState<AffectedRequest[]>([])

  const years = [thisYear - 1, thisYear, thisYear + 1]
  const dates = (holiday: HolidayItem) =>
    holiday.startDate === holiday.endDate
      ? format.day(holiday.startDate)
      : format.dayRange(holiday.startDate, holiday.endDate)

  function onSaved(holiday: HolidayItem, affected: AffectedRequest[]) {
    setEditing(null)
    const startYear = Number(holiday.startDate.slice(0, 4))
    if (startYear !== year) void setYear(startYear)
    notify.success(t(editing === "new" ? "added" : "updated", holiday))
    setImpact(affected)
  }

  async function onDelete(holiday: HolidayItem) {
    if (await removeHoliday(holiday.id)) notify.error(t("failed"))
    else notify.success(t("deleted", { name: holiday.name }))
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-h3 font-bold">{t("title")}</h2>
        <Select
          value={String(year)}
          onValueChange={(value) =>
            void setYear(Number(value) === thisYear ? null : Number(value))
          }
        >
          <SelectTrigger aria-label={t("year")} className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map((option) => (
              <SelectItem key={option} value={String(option)}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button className="ms-auto" onClick={() => setEditing("new")}>
          <PlusIcon aria-hidden />
          {t("add")}
        </Button>
      </div>
      <p className="-mt-2 text-body-sm text-muted-foreground">
        {t("description")}
      </p>

      <Card className="gap-0 overflow-hidden p-0">
        {holidays.length ? (
          <Table>
            <TableCaption className="sr-only">
              {t("caption", { year })}
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>{t("date")}</TableHead>
                <TableHead>{t("name")}</TableHead>
                <TableHead className="w-12">
                  <span className="sr-only">{t("actions")}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {holidays.map((holiday) => (
                <TableRow key={holiday.id} className="group">
                  <TableCell className="tabular whitespace-nowrap">
                    {dates(holiday)}
                  </TableCell>
                  <TableCell className="w-full max-w-0 truncate font-medium">
                    <bdi title={holiday.name}>{holiday.name}</bdi>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={t("actionsFor", { name: holiday.name })}
                          className="opacity-40 group-hover:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100 pointer-coarse:opacity-100"
                        >
                          <EllipsisVerticalIcon aria-hidden />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => setEditing(holiday)}>
                          <PencilIcon aria-hidden />
                          {t("edit")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onSelect={() => setDeleting(holiday)}
                        >
                          <Trash2Icon aria-hidden />
                          {t("delete")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <EmptyState
            icon={CalendarOffIcon}
            title={t("empty.title", { year })}
            body={t("empty.body")}
          />
        )}
      </Card>

      <HolidayDialog
        key={
          editing === null ? "closed" : editing === "new" ? "new" : editing.id
        }
        editing={editing}
        holidays={holidays}
        onClose={() => setEditing(null)}
        onSaved={onSaved}
      />

      <ImpactDialog requests={impact} onClose={() => setImpact([])} />

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={t("deleteDialog.title", { name: deleting?.name ?? "" })}
        description={t("deleteDialog.description", {
          date: deleting ? dates(deleting) : "",
        })}
        cancelLabel={t("deleteDialog.keep")}
        confirmLabel={t("deleteDialog.confirm")}
        onConfirm={() => {
          if (deleting) void onDelete(deleting)
        }}
      />
    </div>
  )
}

/** The holiday is saved; these approved requests fall on it and stay as they are. */
function ImpactDialog({
  requests,
  onClose,
}: {
  requests: AffectedRequest[]
  onClose: () => void
}) {
  const t = useTranslations("settings.holidays.impact")
  const format = useFormat()
  const typeLabel = useRequestTypeLabel()

  return (
    <ConfirmDialog
      open={requests.length > 0}
      onOpenChange={(open) => !open && onClose()}
      variant="neutral"
      title={t("title", { count: requests.length })}
      description={t("description")}
      cancelLabel={t("back")}
      confirmLabel={t("confirm")}
      impact={
        <ul className="flex flex-col gap-2">
          {requests.map((request) => (
            <li key={request.requestId}>
              <Link
                href={`/requests/${request.requestId}`}
                className="font-semibold underline underline-offset-4"
              >
                <bdi>{request.employeeName}</bdi>
              </Link>
              <span className="block text-muted-foreground">
                <bdi>{typeLabel(request.type)}</bdi> ·{" "}
                {request.startDate === request.endDate
                  ? format.day(request.startDate as PlainDate)
                  : format.dayRange(
                      request.startDate as PlainDate,
                      request.endDate as PlainDate
                    )}
              </span>
            </li>
          ))}
        </ul>
      }
      onConfirm={onClose}
    />
  )
}

function HolidayDialog({
  editing,
  holidays,
  onClose,
  onSaved,
}: {
  editing: HolidayItem | "new" | null
  holidays: HolidayItem[]
  onClose: () => void
  onSaved: (holiday: HolidayItem, affected: AffectedRequest[]) => void
}) {
  const t = useTranslations("settings.holidays")
  const tCommon = useTranslations("common")
  const existing = editing !== null && editing !== "new" ? editing : null
  const form = useForm<HolidayInput>({
    resolver: zodResolver(HolidayBody, codeErrorMap) as never,
    mode: "onTouched",
    defaultValues: existing
      ? {
          name: existing.name,
          dates: { from: existing.startDate, to: existing.endDate },
        }
      : { name: "", dates: null },
  })
  const datesError = useFieldError(form, "dates", "holiday-dates")

  const onSubmit = form.handleSubmit(async ({ name, dates }) => {
    const body = {
      name: name.trim(),
      startDate: dates!.from!,
      endDate: dates!.to ?? dates!.from!,
    }
    const result = await saveHoliday(body, existing?.id)
    if (result.problem) {
      showProblem(form, result.problem, {
        startDate: "dates",
        endDate: "dates",
      })
      if (form.formState.errors.root) notify.error(t("failed"))
      return
    }
    onSaved(
      {
        id: existing?.id ?? "",
        ...body,
        startDate: body.startDate as PlainDate,
        endDate: body.endDate as PlainDate,
      },
      result.affected
    )
  })

  return (
    <Dialog open={editing !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent size="sm" closeLabel={tCommon("close")}>
        <form onSubmit={onSubmit} noValidate className="flex min-h-0 flex-col">
          <DialogHeader>
            <DialogTitle>{t(existing ? "editTitle" : "addTitle")}</DialogTitle>
            <DialogDescription>{t("dialogDescription")}</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <FieldGroup>
              <Controller
                control={form.control}
                name="dates"
                render={({ field }) => (
                  <DateRangeField
                    label={t("dates")}
                    value={field.value ?? { from: null, to: null }}
                    onChange={(value) => {
                      field.onChange(value.from ? value : null)
                      if (value.to) field.onBlur()
                    }}
                    holidays={holidayDays(
                      holidays.filter((holiday) => holiday.id !== existing?.id)
                    )}
                    error={datesError?.text}
                  />
                )}
              />
              <TextField form={form} name="name" label={t("name")} />
            </FieldGroup>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {tCommon("cancel")}
            </Button>
            <Button type="submit" loading={form.formState.isSubmitting}>
              {t(existing ? "saveEdit" : "saveNew")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
