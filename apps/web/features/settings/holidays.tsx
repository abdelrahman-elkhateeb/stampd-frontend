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
import { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod"

import { TextField, useFieldError } from "@/components/form-fields"
import { DateField } from "@/components/pickers"
import { Link } from "@/i18n/navigation"
import { codeErrorMap } from "@/lib/forms"
import { useFormat } from "@/lib/use-format"
import { Button } from "@workspace/ui/components/button"
import { Card } from "@workspace/ui/components/card"
import { ConfirmDialog } from "@workspace/ui/components/confirm-dialog"
import type { PlainDate } from "@workspace/ui/components/date-picker"
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

import {
  DEMO_APPROVED_REQUESTS,
  DEMO_HOLIDAYS,
  type ApprovedRequest,
  type HolidayItem,
} from "./demo-data"
import { affectedRequests } from "./rules"

const HolidayBody = z.object({
  date: z.string().min(1),
  name: z.string().trim().min(2).max(60),
})
type HolidayInput = z.infer<typeof HolidayBody>

const THIS_YEAR = 2026

// ponytail: holidays live in state until BE-05; edits reset on reload.
export function HolidaysPage() {
  const t = useTranslations("settings.holidays")
  const format = useFormat()
  const [holidays, setHolidays] = useState(DEMO_HOLIDAYS)
  const [year, setYear] = useState(THIS_YEAR)
  // null = closed, "new" = add, otherwise the holiday being edited.
  const [editing, setEditing] = useState<HolidayItem | "new" | null>(null)
  const [deleting, setDeleting] = useState<HolidayItem | null>(null)
  // A saved holiday waiting for the affected-requests confirmation.
  const [impact, setImpact] = useState<{
    holiday: HolidayItem
    requests: ApprovedRequest[]
  } | null>(null)

  const years = [THIS_YEAR - 1, THIS_YEAR, THIS_YEAR + 1]
  const shown = holidays
    .filter((holiday) => holiday.date.startsWith(String(year)))
    .sort((a, b) => a.date.localeCompare(b.date))

  function commit(holiday: HolidayItem) {
    const isNew = !holidays.some((item) => item.id === holiday.id)
    setHolidays((current) => [
      ...current.filter((item) => item.id !== holiday.id),
      holiday,
    ])
    setYear(Number(holiday.date.slice(0, 4)))
    notify.success(t(isNew ? "added" : "updated", { name: holiday.name }))
  }

  function onSave(holiday: HolidayItem) {
    setEditing(null)
    const requests = affectedRequests(holiday.date, DEMO_APPROVED_REQUESTS)
    if (requests.length) setImpact({ holiday, requests })
    else commit(holiday)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-h3 font-bold">{t("title")}</h2>
        <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
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
        {shown.length ? (
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
              {shown.map((holiday) => (
                <TableRow key={holiday.id} className="group">
                  <TableCell className="tabular whitespace-nowrap">
                    {format.day(holiday.date)}
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
        defaultYear={year}
        onClose={() => setEditing(null)}
        onSave={onSave}
      />

      <ConfirmDialog
        open={impact !== null}
        onOpenChange={(open) => !open && setImpact(null)}
        variant="neutral"
        title={t("impact.title", { count: impact?.requests.length ?? 0 })}
        description={t("impact.description")}
        cancelLabel={t("impact.back")}
        confirmLabel={t("impact.confirm")}
        impact={
          impact ? (
            <ul className="flex flex-col gap-2">
              {impact.requests.map((request) => (
                <li key={request.id}>
                  <Link
                    href={`/requests/${request.id}`}
                    className="font-semibold underline underline-offset-4"
                  >
                    <bdi>{request.employee}</bdi>
                  </Link>
                  <span className="block text-muted-foreground">
                    <bdi>{request.type}</bdi> ·{" "}
                    {request.from === request.to
                      ? format.day(request.from)
                      : format.dayRange(request.from, request.to)}
                  </span>
                </li>
              ))}
            </ul>
          ) : null
        }
        onConfirm={() => {
          if (impact) commit(impact.holiday)
        }}
      />

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={t("deleteDialog.title", { name: deleting?.name ?? "" })}
        description={t("deleteDialog.description", {
          date: deleting ? format.day(deleting.date) : "",
        })}
        cancelLabel={t("deleteDialog.keep")}
        confirmLabel={t("deleteDialog.confirm")}
        onConfirm={() => {
          if (!deleting) return
          setHolidays((current) =>
            current.filter((item) => item.id !== deleting.id)
          )
          notify.success(t("deleted", { name: deleting.name }))
        }}
      />
    </div>
  )
}

function HolidayDialog({
  editing,
  holidays,
  defaultYear,
  onClose,
  onSave,
}: {
  editing: HolidayItem | "new" | null
  holidays: HolidayItem[]
  defaultYear: number
  onClose: () => void
  onSave: (holiday: HolidayItem) => void
}) {
  const t = useTranslations("settings.holidays")
  const tCommon = useTranslations("common")
  const existing = editing !== null && editing !== "new" ? editing : null
  const form = useForm<HolidayInput>({
    resolver: zodResolver(HolidayBody, codeErrorMap),
    mode: "onTouched",
    defaultValues: existing ?? { date: "", name: "" },
  })
  const dateError = useFieldError(form, "date", "holiday-date")

  const onSubmit = form.handleSubmit((body) => {
    const taken = holidays.some(
      (holiday) => holiday.date === body.date && holiday.id !== existing?.id
    )
    if (taken) {
      form.setError("date", { message: "HOLIDAY_EXISTS" })
      return
    }
    onSave({ id: existing?.id ?? crypto.randomUUID(), ...body })
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
                name="date"
                render={({ field }) => (
                  <DateField
                    label={t("date")}
                    value={(field.value as PlainDate) || null}
                    onChange={(value) => {
                      field.onChange(value ?? "")
                      field.onBlur()
                    }}
                    min={`${defaultYear - 1}-01-01`}
                    holidays={holidays}
                    error={dateError?.text}
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
            <Button type="submit">
              {t(existing ? "saveEdit" : "saveNew")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
