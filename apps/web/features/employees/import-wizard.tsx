"use client"

import {
  ArrowLeftIcon,
  CircleCheckIcon,
  DownloadIcon,
  FileTextIcon,
  UploadIcon,
} from "lucide-react"
import { useTranslations } from "next-intl"
import { useEffect, useId, useRef, useState } from "react"

import { UnsavedChangesGuard } from "@/components/unsaved-changes"
import { Link } from "@/i18n/navigation"
import type { Role } from "@/lib/user"
import { useFormat } from "@/lib/use-format"
import { Button } from "@workspace/ui/components/button"
import { Card } from "@workspace/ui/components/card"
import { Checkbox } from "@workspace/ui/components/checkbox"
import type { PlainDate } from "@workspace/ui/components/date-picker"
import { notify } from "@workspace/ui/components/sonner"
import { Stepper } from "@workspace/ui/components/stepper"
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
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group"
import { cn } from "@workspace/ui/lib/utils"

import type { Employee } from "./demo-data"
import {
  IMPORT_COLUMNS,
  IMPORT_MAX_BYTES,
  toCsv,
  validateImport,
  type ImportColumn,
  type ImportRow,
} from "./rules"
import { change, updateStore, useEmployeesStore } from "./store"

const STEPS = ["upload", "preview", "confirm", "result"] as const
type StepId = (typeof STEPS)[number]

const TEMPLATE = toCsv([
  [...IMPORT_COLUMNS],
  [
    "Mona Ali",
    "mona.ali@nakheel.sa",
    "Accountant",
    "Finance",
    "omar.haddad@nakheel.sa",
    "employee",
    "2026-11-01",
  ],
])

function csvHref(csv: string) {
  return `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`
}

// ponytail: parses and imports in the browser; BE-06 validates the upload server-side and
// imports in the background with a notification when done (stepper.md › Behaviour).
export function ImportWizard() {
  const t = useTranslations("employees.import")
  const tAll = useTranslations()
  const format = useFormat()
  const { employees, departments } = useEmployeesStore()
  const [step, setStep] = useState<StepId>("upload")
  const [file, setFile] = useState<{ name: string; rows: ImportRow[] } | null>(
    null
  )
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const [onlyErrors, setOnlyErrors] = useState(false)
  const [sendInvites, setSendInvites] = useState(true)
  const [imported, setImported] = useState(0)
  const input = useRef<HTMLInputElement>(null)
  const heading = useRef<HTMLHeadingElement>(null)
  const firstRender = useRef(true)
  const invitesId = useId()

  // On step change, focus moves to the step's h2 (stepper.md › Accessibility).
  useEffect(() => {
    if (firstRender.current) firstRender.current = false
    else heading.current?.focus()
  }, [step])

  const rows = file?.rows ?? []
  const good = rows.filter((row) => row.problems.length === 0)
  const bad = rows.filter((row) => row.problems.length > 0)
  const problemText = (row: ImportRow) =>
    row.problems
      .map((p) => t(`problems.${p.code}`, { column: t(`columns.${p.column}`) }))
      .join(" · ")
  const errorsCsv = toCsv([
    [...IMPORT_COLUMNS, "problem"],
    ...bad.map((row) => [
      ...IMPORT_COLUMNS.map((column) => row.values[column]),
      problemText(row),
    ]),
  ])

  async function onFile(picked: File | undefined) {
    setUploadError(null)
    if (!picked) return
    if (!/\.csv$/i.test(picked.name)) {
      setUploadError(t("upload.wrongType", { file: picked.name }))
      return
    }
    if (picked.size > IMPORT_MAX_BYTES) {
      setUploadError(t("upload.tooBig", { file: picked.name }))
      return
    }
    const result = validateImport(await picked.text(), employees, departments)
    if (!result.ok) {
      setUploadError(t(`upload.${result.error}`, { file: picked.name }))
      return
    }
    setFile({ name: picked.name, rows: result.rows })
    setOnlyErrors(false)
    setStep("preview")
  }

  function runImport() {
    const departmentId = (name: string) =>
      departments.find((d) => d.name.toLowerCase() === name.toLowerCase())
        ?.id ?? null
    const managerId = (email: string) =>
      employees.find((e) => e.email.toLowerCase() === email.toLowerCase())
        ?.id ?? null
    const created: Employee[] = good.map((row) => ({
      id: crypto.randomUUID(),
      name: row.values.name,
      email: row.values.email.toLowerCase(),
      code: "",
      jobTitle: row.values.job_title,
      departmentId: departmentId(row.values.department),
      managerId: managerId(row.values.manager_email),
      role: (row.values.role.toLowerCase() || "employee") as Role,
      status: "invited",
      joinedOn: row.values.joined_on as PlainDate,
      pendingRequests: 0,
      upcomingLeaveDays: 0,
    }))
    updateStore((current) => ({
      ...current,
      employees: [...current.employees, ...created],
      history: [
        ...current.history,
        ...created.flatMap((employee) => [
          change(employee.id, "imported"),
          ...(sendInvites ? [change(employee.id, "inviteSent")] : []),
        ]),
      ],
    }))
    setImported(created.length)
    setStep("result")
    notify.success(t("result.toast", { count: created.length }))
  }

  const completed = STEPS.slice(0, STEPS.indexOf(step))
  const locked = step === "result"
  const shown = onlyErrors ? bad : rows

  return (
    <div data-density="compact" className="flex flex-col gap-6">
      <UnsavedChangesGuard dirty={file !== null && !locked} />
      <Link
        href="/employees"
        className="-mb-2 inline-flex w-fit items-center gap-1.5 text-body-sm font-semibold text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        <ArrowLeftIcon aria-hidden className="flip-rtl size-4" />
        {tAll("employees.title")}
      </Link>
      <div className="flex flex-col gap-1">
        <h1 className="text-h2 font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>

      <Stepper
        label={t("steps.label")}
        steps={STEPS.map((id) => ({
          id,
          title: t(`steps.${id}`),
          subtitle: id === "upload" ? file?.name : undefined,
        }))}
        currentId={step}
        completed={completed}
        // Completed steps can be revisited until Confirm; after it the flow is locked.
        onStepClick={locked ? undefined : (id) => setStep(id as StepId)}
        stepOf={(index, count, title) =>
          t("steps.stepOf", { index, count, title })
        }
      />

      <Card className="gap-4">
        <h2
          ref={heading}
          tabIndex={-1}
          className="text-h3 font-bold outline-none"
        >
          {t(`${step}.title`)}
        </h2>

        {step === "upload" ? (
          <>
            <p className="text-body-sm text-muted-foreground">
              {t("upload.body")}
            </p>
            <a
              href={csvHref(TEMPLATE)}
              download="stampd-employees-template.csv"
              className="inline-flex w-fit items-center gap-1.5 text-body font-semibold underline underline-offset-4"
            >
              <DownloadIcon aria-hidden className="size-4" />
              {t("upload.template")}
            </a>
            {/* Drag-and-drop is an enhancement; the button is the real control (file-upload.md). */}
            <div
              onDragOver={(event) => {
                event.preventDefault()
                setDragging(true)
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => {
                event.preventDefault()
                setDragging(false)
                void onFile(event.dataTransfer.files[0])
              }}
              className={cn(
                "flex min-h-30 flex-col items-center justify-center gap-1 rounded-lg border-[1.5px] border-dashed border-input p-4 text-center",
                dragging && "border-2 border-border-strong bg-brand-subtle"
              )}
            >
              <UploadIcon
                aria-hidden
                className="size-6 text-muted-foreground"
              />
              <input
                ref={input}
                type="file"
                accept=".csv,text/csv"
                className="sr-only"
                tabIndex={-1}
                aria-hidden
                onChange={(event) => {
                  void onFile(event.target.files?.[0])
                  event.target.value = ""
                }}
              />
              <p className="text-body">
                {dragging
                  ? t("upload.drop")
                  : t.rich("upload.choose", {
                      button: (chunks) => (
                        <Button
                          type="button"
                          variant="link"
                          className="font-bold"
                          onClick={() => input.current?.click()}
                        >
                          {chunks}
                        </Button>
                      ),
                    })}
              </p>
              <p className="text-caption text-muted-foreground">
                {t("upload.constraints")}
              </p>
            </div>
            {uploadError ? (
              <p role="alert" className="text-body-sm text-error">
                {uploadError}
              </p>
            ) : null}
          </>
        ) : null}

        {step === "preview" ? (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <p role="status" className="text-body font-semibold">
                {t("preview.summary", {
                  total: rows.length,
                  ok: good.length,
                  bad: bad.length,
                })}
              </p>
              <ToggleGroup
                type="single"
                variant="outline"
                size="sm"
                aria-label={t("preview.show")}
                value={onlyErrors ? "errors" : "all"}
                onValueChange={(value) =>
                  value && setOnlyErrors(value === "errors")
                }
                className="ms-auto"
              >
                <ToggleGroupItem value="all">
                  {t("preview.all")}
                </ToggleGroupItem>
                <ToggleGroupItem value="errors">
                  {t("preview.errors")}
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
            <div className="overflow-hidden rounded-lg border border-border">
              <Table>
                <TableCaption className="sr-only">
                  {t("preview.caption")}
                </TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-end">
                      {t("preview.line")}
                    </TableHead>
                    {IMPORT_COLUMNS.map((column) => (
                      <TableHead key={column} className="whitespace-nowrap">
                        {t(`columns.${column}`)}
                      </TableHead>
                    ))}
                    <TableHead>{t("preview.problem")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shown.map((row) => {
                    const badColumns = new Set<ImportColumn>(
                      row.problems.map((p) => p.column)
                    )
                    const invalid = row.problems.length > 0
                    return (
                      <TableRow key={row.line}>
                        <TableCell
                          className={cn(
                            "tabular text-end",
                            invalid && "border-s-[3px] border-s-error"
                          )}
                        >
                          {format.number(row.line)}
                        </TableCell>
                        {IMPORT_COLUMNS.map((column) => (
                          <TableCell
                            key={column}
                            className={cn(
                              "max-w-48 truncate",
                              badColumns.has(column) &&
                                "font-semibold text-error"
                            )}
                          >
                            {row.values[column] ? (
                              <bdi>{row.values[column]}</bdi>
                            ) : (
                              <span aria-hidden>–</span>
                            )}
                          </TableCell>
                        ))}
                        <TableCell className="min-w-56 text-error">
                          {invalid ? problemText(row) : null}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep("upload")}
              >
                <ArrowLeftIcon aria-hidden className="flip-rtl" />
                {t("back")}
              </Button>
              <div className="ms-auto flex flex-wrap items-center gap-2">
                {bad.length ? (
                  <Button variant="secondary" size="sm" asChild>
                    <a
                      href={csvHref(errorsCsv)}
                      download="stampd-import-errors.csv"
                    >
                      <DownloadIcon aria-hidden />
                      {t("preview.downloadErrors")}
                    </a>
                  </Button>
                ) : null}
                <Button
                  size="sm"
                  disabled={good.length === 0}
                  aria-describedby={
                    good.length === 0 ? "no-valid-rows" : undefined
                  }
                  onClick={() => setStep("confirm")}
                >
                  {t("preview.next", { count: good.length })}
                </Button>
              </div>
            </div>
            {good.length === 0 ? (
              <p
                id="no-valid-rows"
                className="text-body-sm text-muted-foreground"
              >
                {t("preview.noValidRows")}
              </p>
            ) : null}
          </>
        ) : null}

        {step === "confirm" ? (
          <>
            <ul className="flex list-disc flex-col gap-1 ps-5 text-body">
              <li>{t("confirm.create", { count: good.length })}</li>
              {bad.length ? (
                <li>{t("confirm.skip", { count: bad.length })}</li>
              ) : null}
            </ul>
            <div className="flex items-start gap-3">
              <Checkbox
                id={invitesId}
                checked={sendInvites}
                onCheckedChange={(checked) => setSendInvites(checked === true)}
                className="mt-0.5"
              />
              <label htmlFor={invitesId} className="text-body">
                {t("confirm.sendInvites")}
                <span className="block text-body-sm text-muted-foreground">
                  {t("confirm.sendInvitesHint")}
                </span>
              </label>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep("preview")}
              >
                <ArrowLeftIcon aria-hidden className="flip-rtl" />
                {t("back")}
              </Button>
              <Button size="sm" className="ms-auto" onClick={runImport}>
                {t("confirm.submit", { count: good.length })}
              </Button>
            </div>
          </>
        ) : null}

        {step === "result" ? (
          <>
            <p className="flex items-center gap-2 text-body font-semibold text-success">
              <CircleCheckIcon aria-hidden className="size-5" />
              {t("result.imported", { count: imported })}
            </p>
            {bad.length ? (
              <p className="flex items-center gap-2 text-body">
                <FileTextIcon
                  aria-hidden
                  className="size-5 text-muted-foreground"
                />
                {t("result.skipped", { count: bad.length })}
              </p>
            ) : null}
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" asChild>
                <Link href="/employees?status=invited">{t("result.view")}</Link>
              </Button>
              {bad.length ? (
                <Button variant="secondary" size="sm" asChild>
                  <a
                    href={csvHref(errorsCsv)}
                    download="stampd-import-errors.csv"
                  >
                    <DownloadIcon aria-hidden />
                    {t("preview.downloadErrors")}
                  </a>
                </Button>
              ) : null}
            </div>
          </>
        ) : null}
      </Card>
    </div>
  )
}
