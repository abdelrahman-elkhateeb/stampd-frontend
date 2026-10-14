"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  LoaderCircleIcon,
  TriangleAlertIcon,
  UsersIcon,
} from "lucide-react"
import { useTranslations } from "next-intl"
import { useEffect, useId, useState } from "react"
import { Controller, useForm, useWatch } from "react-hook-form"
import { z } from "zod"

import {
  CheckboxField,
  ReasonField,
  SelectField,
} from "@/components/form-fields"
import { DateRangeField } from "@/components/pickers"
import { submitRequest } from "@/features/requests/actions"
import type { LeaveType } from "@/features/settings/settings-data"
import { Link, useRouter } from "@/i18n/navigation"
import { codeErrorMap, showProblem } from "@/lib/forms"
import { useFormat } from "@/lib/use-format"
import { Button } from "@workspace/ui/components/button"
import type {
  DateRangeValue,
  PlainDate,
} from "@workspace/ui/components/date-picker"
import { ErrorState } from "@workspace/ui/components/error-state"
import { Field, FieldGroup, FieldLabel } from "@workspace/ui/components/field"
import {
  RadioGroup,
  RadioGroupItem,
} from "@workspace/ui/components/radio-group"
import { notify } from "@workspace/ui/components/sonner"
import { cn } from "@workspace/ui/lib/utils"

import {
  previewLeave,
  type LeavePreview,
  type LeavePreviewBody,
} from "./actions"

const HALVES = ["FULL", "MORNING", "AFTERNOON"] as const

const LeaveSchema = z.object({
  leaveTypeId: z.string().min(1),
  dates: z.unknown().superRefine((value, ctx) => {
    const dates = value as DateRangeValue | null
    if (!dates?.from) ctx.addIssue({ code: "custom", message: "REQUIRED" })
  }),
  /** One day: the whole day or half of it. */
  half: z.enum(HALVES),
  /** A range: starts at noon, ends at noon. */
  startsAtNoon: z.boolean(),
  endsAtNoon: z.boolean(),
  reason: z.string().trim().max(1000),
})
type LeaveValues = {
  leaveTypeId: string
  dates: DateRangeValue | null
  half: (typeof HALVES)[number]
  startsAtNoon: boolean
  endsAtNoon: boolean
  reason: string
}

/** The preview and submit body for complete values, else null. */
function toBody(
  values: LeaveValues,
  type?: LeaveType
): LeavePreviewBody | null {
  const from = values.dates?.from
  if (!type || !from) return null
  const to = values.dates?.to ?? from
  const oneDay = from === to
  return {
    leaveTypeId: type.id,
    startDate: from,
    endDate: to,
    firstDayHalf: !type.halfDays
      ? null
      : oneDay
        ? values.half === "FULL"
          ? null
          : values.half
        : values.startsAtNoon
          ? "AFTERNOON"
          : null,
    lastDayHalf:
      type.halfDays && !oneDay && values.endsAtNoon ? "MORNING" : null,
    reason: values.reason.trim() || null,
  }
}

/** FE-07 request flow: the server previews every change (leave-preview.md) before Submit. */
export function LeaveForm({ types }: { types: LeaveType[] }) {
  const t = useTranslations("leave.form")
  const tAll = useTranslations()
  const router = useRouter()
  const halfId = useId()
  const active = types.filter((type) => !type.archived)
  const form = useForm<LeaveValues>({
    resolver: zodResolver(LeaveSchema, codeErrorMap) as never,
    mode: "onTouched",
    defaultValues: {
      leaveTypeId: "",
      dates: null,
      half: "FULL",
      startsAtNoon: false,
      endsAtNoon: false,
      reason: "",
    },
  })
  const values = useWatch({ control: form.control }) as LeaveValues
  const type = active.find((item) => item.id === values.leaveTypeId)
  const body = toBody(values, type)
  const key = JSON.stringify(body)
  const oneDay =
    !!values.dates?.from &&
    (values.dates.to ?? values.dates.from) === values.dates.from
  const [preview, setPreview] = useState<{
    key: string
    result: LeavePreview | null
  } | null>(null)

  // 300 ms after the last change; a stale answer is dropped.
  useEffect(() => {
    if (!body) return
    let current = true
    const timer = setTimeout(() => {
      void previewLeave(body).then((result) => {
        if (current) setPreview({ key, result: result.preview ?? null })
      })
    }, 300)
    return () => {
      current = false
      clearTimeout(timer)
    }
    // `key` is the body's content; the object itself is new every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const loading = !!body && preview?.key !== key
  const shown = body ? preview?.result : null
  const blocked = loading || !shown || shown.problems.length > 0

  const onSubmit = form.handleSubmit(async (input) => {
    const leave = toBody(input, type)
    if (!leave || blocked) return
    const result = await submitRequest({
      type: "LEAVE",
      startDate: leave.startDate,
      endDate: leave.endDate,
      reason: leave.reason,
      data: {
        leaveTypeId: leave.leaveTypeId,
        firstDayHalf: leave.firstDayHalf,
        lastDayHalf: leave.lastDayHalf,
      },
    })
    if ("id" in result) {
      notify.success(t("sent"))
      router.push(`/requests/${result.id}`)
      return
    }
    showProblem(form, result.problem, {
      "data.leaveTypeId": "leaveTypeId",
      startDate: "dates",
      endDate: "dates",
    })
  })

  return (
    <div className="flex max-w-160 flex-col gap-6">
      <Link
        href="/leave"
        className="inline-flex w-fit items-center gap-1 text-body-sm font-semibold underline-offset-4 hover:underline"
      >
        <ArrowLeftIcon aria-hidden className="flip-rtl size-4" />
        {tAll("leave.title")}
      </Link>
      <h1 className="text-h2 font-bold">{t("title")}</h1>
      <form noValidate onSubmit={onSubmit} className="flex flex-col gap-6">
        <FieldGroup>
          <SelectField
            form={form}
            name="leaveTypeId"
            label={t("type")}
            placeholder={tAll("common.choose")}
            options={active.map((item) => ({
              value: item.id,
              label: item.name,
            }))}
          />
          <Controller
            control={form.control}
            name="dates"
            render={({ field, fieldState }) => (
              <DateRangeField
                label={t("dates")}
                value={field.value ?? { from: null, to: null }}
                onChange={(value) => {
                  field.onChange(value.from ? value : null)
                  if (value.to) field.onBlur()
                }}
                error={
                  fieldState.error?.message
                    ? tAll(`fieldErrors.${fieldState.error.message}` as never)
                    : undefined
                }
              />
            )}
          />
          {type?.halfDays && values.dates?.from ? (
            oneDay ? (
              <Field>
                <FieldLabel id={halfId}>{t("half")}</FieldLabel>
                <Controller
                  control={form.control}
                  name="half"
                  render={({ field }) => (
                    <RadioGroup
                      aria-labelledby={halfId}
                      value={field.value}
                      onValueChange={field.onChange}
                      className="flex flex-wrap gap-4"
                    >
                      {HALVES.map((half) => (
                        <label
                          key={half}
                          className="flex items-center gap-2 text-body"
                        >
                          <RadioGroupItem value={half} />
                          {t(`halves.${half}`)}
                        </label>
                      ))}
                    </RadioGroup>
                  )}
                />
              </Field>
            ) : (
              <>
                <CheckboxField
                  form={form}
                  name="startsAtNoon"
                  label={t("startsAtNoon")}
                />
                <CheckboxField
                  form={form}
                  name="endsAtNoon"
                  label={t("endsAtNoon")}
                />
              </>
            )
          ) : null}
          <ReasonField
            form={form}
            name="reason"
            label={
              type?.reasonRequired
                ? t("reason")
                : tAll("requests.form.optional", { label: t("reason") })
            }
            maxLength={1000}
          />
        </FieldGroup>

        <PreviewPanel
          id="leave-preview"
          loading={loading}
          preview={shown ?? null}
          range={body ? { from: body.startDate, to: body.endDate } : null}
          typeName={type?.name}
        />

        {form.formState.errors.root ? (
          <ErrorState variant="inline" title={t("failed")} />
        ) : null}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/leave")}
          >
            {tAll("common.cancel")}
          </Button>
          <Button
            type="submit"
            disabled={!!body && blocked}
            aria-describedby="leave-preview"
            loading={form.formState.isSubmitting}
          >
            {t("submit")}
          </Button>
        </div>
      </form>
    </div>
  )
}

/** docs/design-system/components/leave-preview.md */
function PreviewPanel({
  id,
  loading,
  preview,
  range,
  typeName,
}: {
  id: string
  loading: boolean
  preview: LeavePreview | null
  range: { from: string; to: string } | null
  typeName?: string
}) {
  const t = useTranslations("leave.preview")
  const tProblems = useTranslations("leave.problems")
  const format = useFormat()
  if (!range) return null
  if (!preview)
    return (
      <div id={id} className="flex items-center gap-2 text-muted-foreground">
        <LoaderCircleIcon aria-hidden className="size-4 animate-spin" />
        {t("checking")}
      </div>
    )

  const dates =
    range.from === range.to
      ? format.day(range.from as PlainDate)
      : format.dayRange(range.from as PlainDate, range.to as PlainDate)
  const problemText = (problem: LeavePreview["problems"][number]) =>
    problem.code === "INSUFFICIENT_BALANCE"
      ? tProblems("INSUFFICIENT_BALANCE", {
          available: format.number(preview.balance.available),
          needed: format.number(preview.days),
        })
      : problem.code === "REQUIRED" && problem.field === "reason"
        ? tProblems("REASON_REQUIRED")
        : tProblems.has(problem.code as never)
          ? tProblems(problem.code as never)
          : problem.message

  return (
    <div
      id={id}
      className={cn(
        "relative flex flex-col gap-3 rounded-lg border bg-card p-4 transition-opacity",
        loading && "opacity-50"
      )}
    >
      {loading ? (
        <LoaderCircleIcon
          aria-hidden
          className="absolute end-3 top-3 size-4 animate-spin"
        />
      ) : null}
      <p aria-live="polite" className="text-body-lg font-bold">
        {t("days", { count: preview.days })}
        <span className="block text-body-sm font-normal text-muted-foreground">
          {dates}
        </span>
      </p>
      {preview.balance.tracked && typeName ? (
        <p className="flex flex-wrap items-center gap-2 text-body">
          {t("balance", { type: typeName })}
          <span className="tabular">
            {format.number(preview.balance.available)}
          </span>
          <ArrowRightIcon aria-hidden className="flip-rtl size-4" />
          <span
            className={cn(
              "tabular rounded-pill border border-border-strong bg-cat-leave px-2 font-semibold",
              preview.balance.availableAfter < 0 && "text-error"
            )}
          >
            {format.number(preview.balance.availableAfter)}
          </span>
        </p>
      ) : null}
      {preview.excluded.length ? (
        <p className="text-body-sm text-muted-foreground">
          {t("notCounted", {
            days: preview.excluded
              .map((day) =>
                day.holiday
                  ? `${day.holiday.name} (${format.day(day.date as PlainDate)})`
                  : format.day(day.date as PlainDate)
              )
              .join(", "),
          })}
        </p>
      ) : null}
      {preview.teamOff.length ? (
        <p className="flex items-center gap-2 text-body-sm text-warning">
          <UsersIcon aria-hidden className="size-4 shrink-0" />
          {t("teamOff", {
            names: preview.teamOff.map((person) => person.name).join(", "),
          })}
        </p>
      ) : null}
      {preview.problems.length ? (
        <ul
          role="alert"
          className="flex flex-col gap-1 rounded-md bg-error-bg px-3 py-2 text-body-sm text-error"
        >
          {preview.problems.map((problem, index) => (
            <li key={index} className="flex gap-2">
              <TriangleAlertIcon
                aria-hidden
                className="mt-0.5 size-4 shrink-0"
              />
              {problemText(problem)}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
