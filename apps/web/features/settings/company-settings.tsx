"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { ImageUpIcon } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { useId, useMemo, useRef, useState, useTransition } from "react"
import { Controller, useForm, useWatch } from "react-hook-form"
import { z } from "zod"

import {
  StepperField,
  TextField,
  useFieldError,
} from "@/components/form-fields"
import { TimeField } from "@/components/pickers"
import { UnsavedChangesGuard } from "@/components/unsaved-changes"
import { useUser } from "@/components/user-provider"
import { getIntlLocale } from "@/i18n/locale"
import type { Locale } from "@/i18n/routing"
import { codeErrorMap, showProblem } from "@/lib/forms"
import { useFormat } from "@/lib/use-format"
import { toWeekday } from "@/lib/user"
import { useTimeZones } from "@/lib/time-zones"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import type { PlainDate, Weekday } from "@workspace/ui/components/date-picker"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"
import { inputClassName } from "@workspace/ui/components/input"
import { notify } from "@workspace/ui/components/sonner"
import { ChangesTimeline } from "@workspace/ui/components/timeline"
import { WeekdayToggle } from "@workspace/ui/components/weekday-toggle"

import { removeLogo, saveSettings, uploadLogo } from "./actions"
import {
  SETTINGS_FIELDS,
  settingsChange,
  workingDaysSummary,
  type CompanyValues,
} from "./rules"
import type { CompanySettings, SettingsChange } from "./settings-data"

const HH_MM = /^\d{2}:\d{2}$/

const CompanyBody = z
  .object({
    name: z.string().trim().min(2).max(80),
    timezone: z.string().min(1),
    workingDays: z.array(z.number().int().min(0).max(6)).min(1),
    workStart: z.string().regex(HH_MM),
    workEnd: z.string().regex(HH_MM),
    graceMinutes: z
      .number()
      .int()
      .min(0, { error: "NEGATIVE" })
      .max(240, { error: "GRACE_MAX" }),
    leaveYearStartMonth: z.number().int().min(1).max(12),
  })
  .refine((body) => body.workEnd > body.workStart, {
    path: ["workEnd"],
    message: "END_BEFORE_START",
  })

/** Week-day and month names from Intl, so both languages come for free. */
export function useCalendarNames() {
  const locale = getIntlLocale(useLocale() as Locale)
  const t = useTranslations("settings.company")
  const { timezone } = useUser().company
  return useMemo(() => {
    // 2026-10-04 is a Sunday.
    const day = (index: number) => new Date(Date.UTC(2026, 9, 4 + index))
    const weekday = (style: "long" | "short") =>
      new Intl.DateTimeFormat(locale, { weekday: style, timeZone: "UTC" })
    const short = t("dayLetters").split(",")
    return {
      days: Array.from({ length: 7 }, (_, index) => ({
        short: short[index]!,
        long: weekday("long").format(day(index)),
      })),
      dayShort: Array.from({ length: 7 }, (_, index) =>
        weekday("short").format(day(index))
      ),
      months: Array.from({ length: 12 }, (_, index) =>
        new Intl.DateTimeFormat(locale, {
          month: "long",
          timeZone: "UTC",
        }).format(new Date(Date.UTC(2026, index, 1)))
      ),
      dateTime: new Intl.DateTimeFormat(locale, {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: timezone,
      }),
    }
  }, [locale, t, timezone])
}

const valuesOf = (settings: CompanySettings): CompanyValues => ({
  name: settings.name,
  timezone: settings.timezone,
  workingDays: settings.workingDays,
  workStart: settings.workStart,
  workEnd: settings.workEnd,
  graceMinutes: settings.graceMinutes,
  leaveYearStartMonth: settings.leaveYearStartMonth,
})

/** API field names back to form fields, for field errors. */
const FORM_FIELDS = Object.fromEntries(
  Object.entries(SETTINGS_FIELDS).map(([form, api]) => [api, form])
)

export function CompanySettingsPage({
  settings,
  history,
}: {
  settings: CompanySettings
  history: SettingsChange[]
}) {
  const t = useTranslations("settings.company")
  const saved = valuesOf(settings)
  const form = useForm({
    resolver: zodResolver(CompanyBody, codeErrorMap),
    mode: "onTouched",
    defaultValues: saved,
  })
  const dirty = form.formState.isDirty

  const onSubmit = form.handleSubmit(async (values) => {
    const next = { ...values, workingDays: values.workingDays as Weekday[] }
    const problem = await saveSettings(settingsChange(saved, next))
    if (problem) {
      showProblem(form, problem, FORM_FIELDS)
      if (form.formState.errors.root) notify.error(t("failed"))
      return
    }
    form.reset(next)
    notify.success(t("saved"))
  })

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-4 lg:grid-cols-[minmax(0,40rem)_minmax(0,1fr)] lg:gap-6">
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <UnsavedChangesGuard dirty={dirty} />
        <ProfileCard
          form={form}
          logoUrl={settings.logoUrl}
          pendingFrom={settings.timezoneEffectiveFrom}
        />
        <WorkCalendarCard form={form} weekStart={settings.weekStart} />
        <div className="flex flex-wrap items-center justify-end gap-2">
          {dirty ? (
            <p className="me-auto text-body-sm text-muted-foreground">
              {t("unsaved")}
            </p>
          ) : null}
          <Button
            type="button"
            variant="outline"
            disabled={!dirty}
            onClick={() => form.reset(saved)}
          >
            {t("discard")}
          </Button>
          <Button
            type="submit"
            disabled={!dirty}
            loading={form.formState.isSubmitting}
          >
            {t("save")}
          </Button>
        </div>
      </form>
      <HistoryCard history={history} weekStart={settings.weekStart} />
    </div>
  )
}

type CompanyForm = ReturnType<typeof useForm<z.input<typeof CompanyBody>>>

function ProfileCard({
  form,
  logoUrl,
  pendingFrom,
}: {
  form: CompanyForm
  logoUrl: string | null
  /** The day a saved timezone change starts to apply. */
  pendingFrom: string | null
}) {
  const t = useTranslations("settings.company")
  const format = useFormat()
  const timezoneId = useId()
  const zones = useTimeZones([form.formState.defaultValues?.timezone ?? ""])
  const name = useWatch({ control: form.control, name: "name" })

  return (
    <Card aria-labelledby="profile-title">
      <CardHeader>
        <CardTitle id="profile-title">{t("profile.title")}</CardTitle>
        <CardDescription>{t("profile.description")}</CardDescription>
      </CardHeader>
      <FieldGroup>
        <TextField
          form={form}
          name="name"
          label={t("profile.name")}
          autoComplete="organization"
        />
        <Field>
          <FieldLabel htmlFor={timezoneId}>{t("profile.timezone")}</FieldLabel>
          {/* Native select: ~400 zones, with the platform's own typeahead. */}
          <select
            id={timezoneId}
            dir="ltr"
            aria-describedby={`${timezoneId}-description`}
            className={inputClassName}
            {...form.register("timezone")}
          >
            {zones.map((zone) => (
              <option key={zone} value={zone}>
                {zone.replaceAll("_", " ")}
              </option>
            ))}
          </select>
          <FieldDescription id={`${timezoneId}-description`}>
            {pendingFrom
              ? t("profile.timezonePending", {
                  date: format.day(pendingFrom as PlainDate),
                })
              : t("profile.timezoneHint")}
          </FieldDescription>
        </Field>
        <LogoField companyName={name} logoUrl={logoUrl} />
      </FieldGroup>
    </Card>
  )
}

const LOGO_TYPES = ["image/png", "image/jpeg", "image/webp"]
const LOGO_MAX_BYTES = 2 * 1024 * 1024

// The two card colours from tokens.css: the preview shows both themes whatever the page uses.
const PREVIEW_THEMES = [
  { id: "light", card: "#FFFDF9", text: "#111111" },
  { id: "dark", card: "#1F1C17", text: "#F4EFE7" },
] as const

/** components/file-upload.md (image) · ponytail: no drag-and-drop or crop. */
function LogoField({
  companyName,
  logoUrl,
}: {
  companyName: string
  logoUrl: string | null
}) {
  const t = useTranslations("settings.company.logo")
  const input = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string>()
  const [busy, startTransition] = useTransition()
  const initials = companyName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase()

  function onFile(file: File | undefined) {
    if (input.current) input.current.value = ""
    if (!file) return
    if (!LOGO_TYPES.includes(file.type)) {
      setError(t("wrongType", { file: file.name }))
      return
    }
    if (file.size > LOGO_MAX_BYTES) {
      setError(t("tooBig", { file: file.name }))
      return
    }
    setError(undefined)
    const data = new FormData()
    data.set("file", file)
    startTransition(async () => {
      if (await uploadLogo(data)) setError(t("failed"))
      else notify.success(t("done"))
    })
  }

  function remove() {
    startTransition(async () => {
      if (await removeLogo()) setError(t("failed"))
    })
  }

  return (
    <Field>
      <span id="logo-label" className="text-body font-semibold">
        {t("label")}
      </span>
      <div
        role="group"
        aria-labelledby="logo-label"
        className="grid grid-cols-2 gap-2"
      >
        {PREVIEW_THEMES.map((theme) => (
          <div
            key={theme.id}
            className="flex items-center gap-3 rounded-md border border-border p-3"
            style={{ background: theme.card, color: theme.text }}
          >
            <span
              className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-md text-h4 font-bold"
              style={{
                background: logoUrl ? "#FFFDF9" : theme.text,
                color: theme.card,
              }}
            >
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- a signed API URL
                <img
                  src={logoUrl}
                  alt=""
                  className="size-full object-contain p-1"
                />
              ) : (
                initials
              )}
            </span>
            <span className="text-caption font-semibold">
              {t(`on.${theme.id}`)}
            </span>
          </div>
        ))}
      </div>
      <div className="relative flex flex-wrap items-center gap-x-3 gap-y-1">
        <input
          ref={input}
          type="file"
          accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          onChange={(event) => onFile(event.target.files?.[0])}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          loading={busy}
          onClick={() => input.current?.click()}
        >
          <ImageUpIcon aria-hidden />
          {logoUrl ? t("replace") : t("choose")}
        </Button>
        {logoUrl ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={busy}
            onClick={remove}
          >
            {t("remove")}
          </Button>
        ) : null}
        <span className="text-caption text-muted-foreground">{t("hint")}</span>
      </div>
      {error ? (
        <p role="alert" className="text-body-sm text-error">
          {error}
        </p>
      ) : null}
    </Field>
  )
}

function WorkCalendarCard({
  form,
  weekStart,
}: {
  form: CompanyForm
  weekStart: Weekday
}) {
  const t = useTranslations("settings.company.calendar")
  const names = useCalendarNames()
  const daysId = useId()
  const monthId = useId()
  const [lastDayWarning, setLastDayWarning] = useState(false)
  const days = useWatch({ control: form.control, name: "workingDays" })
  const startError = useFieldError(form, "workStart", "work-start")
  const endError = useFieldError(form, "workEnd", "work-end")

  return (
    <Card aria-labelledby="calendar-title">
      <CardHeader>
        <CardTitle id="calendar-title">{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <FieldGroup>
        <Field>
          <span id={daysId} className="text-body font-semibold">
            {t("workingDays")}
          </span>
          <Controller
            control={form.control}
            name="workingDays"
            render={({ field }) => (
              <WeekdayToggle
                labelledBy={daysId}
                describedBy={`${daysId}-summary`}
                value={field.value as Weekday[]}
                onChange={(next) => {
                  setLastDayWarning(false)
                  field.onChange(next)
                }}
                onEmpty={() => setLastDayWarning(true)}
                weekStartsOn={weekStart}
                dayNames={names.days}
              />
            )}
          />
          <p
            id={`${daysId}-summary`}
            aria-live="polite"
            className="text-body-sm font-medium"
          >
            {t("daysSummary", {
              count: days.length,
              days: workingDaysSummary(
                days as Weekday[],
                weekStart,
                names.dayShort
              ),
            })}
          </p>
          {lastDayWarning ? (
            <FieldError>{t("pickOneDay")}</FieldError>
          ) : (
            <FieldDescription>{t("appliesNextLoad")}</FieldDescription>
          )}
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Controller
            control={form.control}
            name="workStart"
            render={({ field }) => (
              <TimeField
                label={t("workStart")}
                value={field.value || null}
                onChange={(value) => {
                  field.onChange(value ?? "")
                  // The end-time rule depends on the start too.
                  if (form.formState.touchedFields.workEnd)
                    void form.trigger("workEnd")
                }}
                error={startError?.text}
              />
            )}
          />
          <Controller
            control={form.control}
            name="workEnd"
            render={({ field }) => (
              <TimeField
                label={t("workEnd")}
                value={field.value || null}
                onChange={(value) => {
                  field.onChange(value ?? "")
                  field.onBlur()
                }}
                error={endError?.text}
              />
            )}
          />
        </div>
        <StepperField
          form={form}
          name="graceMinutes"
          label={t("grace")}
          description={t("graceHint")}
          unit={t("minutesUnit")}
          max={240}
        />
        <Field>
          <FieldLabel htmlFor={monthId}>{t("leaveYear")}</FieldLabel>
          <select
            id={monthId}
            aria-describedby={`${monthId}-description`}
            className={inputClassName}
            {...form.register("leaveYearStartMonth", { valueAsNumber: true })}
          >
            {names.months.map((month, index) => (
              <option key={month} value={index + 1}>
                {month}
              </option>
            ))}
          </select>
          <FieldDescription id={`${monthId}-description`}>
            {t("leaveYearHint")}
          </FieldDescription>
        </Field>
      </FieldGroup>
    </Card>
  )
}

function HistoryCard({
  history,
  weekStart,
}: {
  history: SettingsChange[]
  weekStart: Weekday
}) {
  const t = useTranslations("settings.company")
  const tFields = useTranslations("settings.company.history.fields")
  const names = useCalendarNames()

  const show = (field: string, value: unknown) => {
    if (value === null || value === undefined || value === "") return "—"
    if (field === "workingDays")
      return workingDaysSummary(
        (value as string[]).map(toWeekday),
        weekStart,
        names.dayShort
      )
    if (field === "weekStart") return names.days[toWeekday(String(value))]!.long
    if (field === "leaveYearStartMonth")
      return names.months[(value as number) - 1]!
    if (field === "lateGraceMinutes")
      return t("calendar.minutes", { count: value as number })
    if (field === "logoFileId") return t("history.logoSet")
    if (Array.isArray(value)) return value.join(", ") || "—"
    return String(value)
  }

  return (
    <Card aria-labelledby="history-title">
      <CardHeader>
        <CardTitle id="history-title">{t("history.title")}</CardTitle>
        <CardDescription>{t("history.description")}</CardDescription>
      </CardHeader>
      {history.length ? (
        <ChangesTimeline
          label={t("history.title")}
          labels={{
            was: t("history.was"),
            now: t("history.now"),
            changedTo: t("history.changedTo"),
            showAll: (count) => t("history.showAll", { count }),
          }}
          events={history.map((change) => ({
            id: change.id,
            action: t("history.action"),
            actor: change.actor ?? t("history.system"),
            at: names.dateTime.format(new Date(change.at)),
            dateTime: change.at,
            source: t("history.manual"),
            fields: change.fields.map(({ field, from, to }) => ({
              // Dynamic key: a field the app doesn't know shows its API name.
              label: tFields.has(field as never)
                ? tFields(field as never)
                : field,
              from: show(field, from),
              to: show(field, to),
            })),
          }))}
        />
      ) : (
        <p className="text-body text-muted-foreground">{t("history.empty")}</p>
      )}
    </Card>
  )
}
