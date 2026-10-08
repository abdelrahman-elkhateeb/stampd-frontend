"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { ImageUpIcon } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { useId, useMemo, useRef, useState } from "react"
import { Controller, useForm, useWatch } from "react-hook-form"
import { z } from "zod"

import {
  StepperField,
  TextField,
  useFieldError,
} from "@/components/form-fields"
import { TimeField } from "@/components/pickers"
import { UnsavedChangesGuard } from "@/components/unsaved-changes"
import { getIntlLocale } from "@/i18n/locale"
import type { Locale } from "@/i18n/routing"
import { DEMO_USER } from "@/lib/demo-user"
import { codeErrorMap } from "@/lib/forms"
import { useTimeZones } from "@/lib/time-zones"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import type { Weekday } from "@workspace/ui/components/date-picker"
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

import {
  DEMO_COMPANY,
  DEMO_SETTINGS_HISTORY,
  type CompanySettings,
  type SettingsChange,
} from "./demo-data"
import { accentOutline, settingsDiff, workingDaysSummary } from "./rules"

const HH_MM = /^\d{2}:\d{2}$/

const CompanyBody = z
  .object({
    name: z.string().trim().min(2).max(80),
    timezone: z.string().min(1),
    accent: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    workingDays: z.array(z.number().int().min(0).max(6)).min(1),
    workStart: z.string().regex(HH_MM),
    workEnd: z.string().regex(HH_MM),
    graceMinutes: z
      .number()
      .int()
      .min(0, { error: "NEGATIVE" })
      .max(120, { error: "GRACE_MAX" }),
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
        timeZone: DEMO_USER.company.timezone,
      }),
    }
  }, [locale, t])
}

export function CompanySettingsPage() {
  const t = useTranslations("settings.company")
  const [saved, setSaved] = useState<CompanySettings>(DEMO_COMPANY)
  const [history, setHistory] = useState(DEMO_SETTINGS_HISTORY)
  const form = useForm({
    resolver: zodResolver(CompanyBody, codeErrorMap),
    mode: "onTouched",
    defaultValues: saved,
  })
  const dirty = form.formState.isDirty

  // ponytail: no API yet (BE-05); saved values and history reset on reload.
  const onSubmit = form.handleSubmit((values) => {
    const next = { ...values, workingDays: values.workingDays as Weekday[] }
    const fields = settingsDiff(saved, next)
    if (fields.length) {
      setHistory((current) => [
        {
          id: crypto.randomUUID(),
          actor: DEMO_USER.name,
          at: new Date().toISOString(),
          fields,
        },
        ...current,
      ])
    }
    setSaved(next)
    form.reset(next)
    notify.success(t("saved"))
  })

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-4 lg:grid-cols-[minmax(0,40rem)_minmax(0,1fr)] lg:gap-6">
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <UnsavedChangesGuard dirty={dirty} />
        <ProfileCard form={form} />
        <WorkCalendarCard form={form} />
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
          <Button type="submit" disabled={!dirty}>
            {t("save")}
          </Button>
        </div>
      </form>
      <HistoryCard history={history} />
    </div>
  )
}

type CompanyForm = ReturnType<typeof useForm<z.input<typeof CompanyBody>>>

function ProfileCard({ form }: { form: CompanyForm }) {
  const t = useTranslations("settings.company")
  const timezoneId = useId()
  const zones = useTimeZones([DEMO_COMPANY.timezone])
  const accentId = useId()
  const accent = useWatch({ control: form.control, name: "accent" })
  const name = useWatch({ control: form.control, name: "name" })
  const outline = accentOutline(accent)

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
            {t("profile.timezoneHint")}
          </FieldDescription>
        </Field>
        <LogoField companyName={name} accent={accent} outline={outline} />
        <Field>
          <FieldLabel htmlFor={accentId}>{t("profile.accent")}</FieldLabel>
          <div className="flex items-center gap-3">
            <input
              id={accentId}
              type="color"
              aria-describedby={`${accentId}-description`}
              className="h-control w-16 cursor-pointer rounded-md border border-input bg-card p-1"
              {...form.register("accent")}
            />
            <span dir="ltr" className="tabular text-body font-medium uppercase">
              {accent}
            </span>
          </div>
          <FieldDescription id={`${accentId}-description`}>
            {t("profile.accentHint")}
            {outline.light || outline.dark
              ? ` ${t(outline.light ? "profile.outlineLight" : "profile.outlineDark")}`
              : null}
          </FieldDescription>
        </Field>
      </FieldGroup>
    </Card>
  )
}

const LOGO_TYPES = ["image/png", "image/svg+xml", "image/jpeg"]
const LOGO_MAX_BYTES = 1024 * 1024

// The two card colours from tokens.css: the preview shows both themes whatever the page uses.
const PREVIEW_THEMES = [
  { id: "light", card: "#FFFDF9", strong: "#111111", text: "#111111" },
  { id: "dark", card: "#1F1C17", strong: "#D8D0C4", text: "#F4EFE7" },
] as const

/** components/file-upload.md (image) · ponytail: no drag-and-drop, crop or upload (BE-05); the logo shows until reload. */
function LogoField({
  companyName,
  accent,
  outline,
}: {
  companyName: string
  accent: string
  outline: { light: boolean; dark: boolean }
}) {
  const t = useTranslations("settings.company.logo")
  const input = useRef<HTMLInputElement>(null)
  const [logo, setLogo] = useState<string>()
  const [error, setError] = useState<string>()
  const initials = companyName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase()

  function onFile(file: File | undefined) {
    if (!file) return
    if (!LOGO_TYPES.includes(file.type)) {
      setError(t("wrongType", { file: file.name }))
    } else if (file.size > LOGO_MAX_BYTES) {
      setError(t("tooBig", { file: file.name }))
    } else {
      setError(undefined)
      setLogo(URL.createObjectURL(file))
      notify.success(t("done"))
    }
    if (input.current) input.current.value = ""
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
                background: logo ? "#FFFDF9" : theme.text,
                color: theme.card,
                boxShadow: `0 0 0 2px ${theme.card}, 0 0 0 4px ${accent}${outline[theme.id] ? `, 0 0 0 5px ${theme.strong}` : ""}`,
              }}
            >
              {logo ? (
                // eslint-disable-next-line @next/next/no-img-element -- a local blob preview
                <img
                  src={logo}
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
          accept=".png,.svg,.jpg,.jpeg,image/png,image/svg+xml,image/jpeg"
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          onChange={(event) => onFile(event.target.files?.[0])}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => input.current?.click()}
        >
          <ImageUpIcon aria-hidden />
          {logo ? t("replace") : t("choose")}
        </Button>
        {logo ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setLogo(undefined)}
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

function WorkCalendarCard({ form }: { form: CompanyForm }) {
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
                weekStartsOn={DEMO_USER.company.weekStart}
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
                DEMO_USER.company.weekStart,
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
          max={120}
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

function HistoryCard({ history }: { history: SettingsChange[] }) {
  const t = useTranslations("settings.company")
  const tFields = useTranslations("settings.company.history.fields")
  const names = useCalendarNames()

  const show = (
    field: keyof CompanySettings,
    value: CompanySettings[keyof CompanySettings]
  ) => {
    if (field === "workingDays")
      return workingDaysSummary(
        value as Weekday[],
        DEMO_USER.company.weekStart,
        names.dayShort
      )
    if (field === "leaveYearStartMonth")
      return names.months[(value as number) - 1]!
    if (field === "graceMinutes")
      return t("calendar.minutes", { count: value as number })
    return String(value)
  }

  return (
    <Card aria-labelledby="history-title">
      <CardHeader>
        <CardTitle id="history-title">{t("history.title")}</CardTitle>
        <CardDescription>{t("history.description")}</CardDescription>
      </CardHeader>
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
          actor: change.actor,
          at: names.dateTime.format(new Date(change.at)),
          dateTime: change.at,
          source: t("history.manual"),
          fields: change.fields.map(({ field, from, to }) => ({
            label: tFields(field),
            from: show(field, from),
            to: show(field, to),
          })),
        }))}
      />
    </Card>
  )
}
