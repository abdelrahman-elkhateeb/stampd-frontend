"use client"

import {
  ArrowLeftIcon,
  CircleCheckIcon,
  DownloadIcon,
  FileTextIcon,
  UploadIcon,
} from "lucide-react"
import { useTranslations } from "next-intl"
import { useEffect, useRef, useState } from "react"

import { UnsavedChangesGuard } from "@/components/unsaved-changes"
import { Link } from "@/i18n/navigation"
import { useFormat } from "@/lib/use-format"
import { Button } from "@workspace/ui/components/button"
import { Card } from "@workspace/ui/components/card"
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
import { cn } from "@workspace/ui/lib/utils"

import { importEmployees, type ImportOutcome } from "./actions"
import { checkImport, IMPORT_COLUMNS, IMPORT_MAX_BYTES, toCsv } from "./rules"

const STEPS = ["upload", "preview", "confirm", "result"] as const
type StepId = (typeof STEPS)[number]

const TEMPLATE = toCsv([
  [...IMPORT_COLUMNS],
  [
    "Mona Ali",
    "mona.ali@example.com",
    "2026-11-01",
    "Accountant",
    "Finance",
    "omar.haddad@example.com",
    "EMPLOYEE",
    "",
    "",
  ],
])

function csvHref(csv: string) {
  return `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`
}

type Parsed = { name: string; text: string; header: string[]; rows: string[][] }

/** The API checks and creates every row in one call (BE-06); there is no dry run. */
export function ImportWizard() {
  const t = useTranslations("employees.import")
  const tAll = useTranslations()
  const format = useFormat()
  const [step, setStep] = useState<StepId>("upload")
  const [file, setFile] = useState<Parsed | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const [busy, setBusy] = useState(false)
  const [outcome, setOutcome] = useState<ImportOutcome | null>(null)
  const input = useRef<HTMLInputElement>(null)
  const heading = useRef<HTMLHeadingElement>(null)
  const firstRender = useRef(true)

  // On step change, focus moves to the step's h2 (stepper.md › Accessibility).
  useEffect(() => {
    if (firstRender.current) firstRender.current = false
    else heading.current?.focus()
  }, [step])

  const header = file?.header ?? []
  const rows = file?.rows ?? []
  const errors = outcome?.errors ?? []
  const problemText = (error: ImportOutcome["errors"][number]) => {
    const code = `fieldErrors.${error.code}`
    return `${error.field}: ${tAll.has(code as never) ? tAll(code as never) : error.message}`
  }
  // The failed rows as they were in the file, with what went wrong.
  const failedLines = [...new Set(errors.map((error) => error.row))]
  const errorsCsv = toCsv([
    [...header, "problem"],
    ...failedLines.map((line) => [
      ...(rows[line - 2] ?? []),
      errors
        .filter((error) => error.row === line)
        .map(problemText)
        .join(" · "),
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
    const text = await picked.text()
    const result = checkImport(text)
    if (!result.ok) {
      setUploadError(t(`upload.${result.error}`, { file: picked.name }))
      return
    }
    setFile({
      name: picked.name,
      text,
      header: result.header,
      rows: result.rows,
    })
    setStep("preview")
  }

  async function runImport() {
    if (!file) return
    setBusy(true)
    const result = await importEmployees(file.text).finally(() =>
      setBusy(false)
    )
    if (result.problem) {
      notify.error(t("failed"))
      return
    }
    setOutcome(result.outcome)
    setStep("result")
    notify.success(t("result.toast", { count: result.outcome.createdCount }))
  }

  const completed = STEPS.slice(0, STEPS.indexOf(step))
  const locked = step === "result"

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
            <p role="status" className="text-body font-semibold">
              {t("preview.summary", { total: rows.length })}
            </p>
            <div className="overflow-x-auto rounded-lg border border-border">
              <Table>
                <TableCaption className="sr-only">
                  {t("preview.caption")}
                </TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-end">
                      {t("preview.line")}
                    </TableHead>
                    {header.map((column) => (
                      <TableHead key={column} className="whitespace-nowrap">
                        <bdi dir="ltr">{column}</bdi>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell className="tabular text-end">
                        {format.number(index + 2)}
                      </TableCell>
                      {header.map((column, cell) => (
                        <TableCell key={column} className="max-w-48 truncate">
                          {row[cell]?.trim() ? (
                            <bdi>{row[cell]}</bdi>
                          ) : (
                            <span aria-hidden>–</span>
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
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
              <Button
                size="sm"
                className="ms-auto"
                onClick={() => setStep("confirm")}
              >
                {t("preview.next", { count: rows.length })}
              </Button>
            </div>
          </>
        ) : null}

        {step === "confirm" ? (
          <>
            <ul className="flex list-disc flex-col gap-1 ps-5 text-body">
              <li>{t("confirm.create", { count: rows.length })}</li>
              <li>{t("confirm.invites")}</li>
              <li>{t("confirm.skip")}</li>
            </ul>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep("preview")}
              >
                <ArrowLeftIcon aria-hidden className="flip-rtl" />
                {t("back")}
              </Button>
              <Button
                size="sm"
                className="ms-auto"
                loading={busy}
                onClick={runImport}
              >
                {t("confirm.submit", { count: rows.length })}
              </Button>
            </div>
          </>
        ) : null}

        {step === "result" && outcome ? (
          <>
            <p className="flex items-center gap-2 text-body font-semibold text-success">
              <CircleCheckIcon aria-hidden className="size-5" />
              {t("result.imported", { count: outcome.createdCount })}
            </p>
            {failedLines.length ? (
              <>
                <p className="flex items-center gap-2 text-body">
                  <FileTextIcon
                    aria-hidden
                    className="size-5 text-muted-foreground"
                  />
                  {t("result.skipped", { count: failedLines.length })}
                </p>
                <div className="overflow-hidden rounded-lg border border-border">
                  <Table>
                    <TableCaption className="sr-only">
                      {t("result.caption")}
                    </TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-end">
                          {t("preview.line")}
                        </TableHead>
                        <TableHead>{t("preview.problem")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {errors.map((error, index) => (
                        <TableRow key={index}>
                          <TableCell className="tabular border-s-[3px] border-s-error text-end">
                            {format.number(error.row)}
                          </TableCell>
                          <TableCell className="text-error">
                            <bdi>{problemText(error)}</bdi>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            ) : null}
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" asChild>
                <Link href="/employees?status=invited">{t("result.view")}</Link>
              </Button>
              {failedLines.length ? (
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
