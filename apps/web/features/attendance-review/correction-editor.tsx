"use client"

import { PlusIcon, SaveIcon, Trash2Icon } from "lucide-react"
import { useTranslations } from "next-intl"
import { useId, useState } from "react"

import { TimeField } from "@/components/pickers"
import { useUser } from "@/components/user-provider"
import {
  addSession,
  editSession,
  removeSession,
} from "@/features/attendance/actions"
import type { DayDetail } from "@/features/attendance/attendance-data"
import { companyInstant, companyTime } from "@/features/attendance/rules"
import { Button } from "@workspace/ui/components/button"
import { notify } from "@workspace/ui/components/sonner"
import { Textarea } from "@workspace/ui/components/textarea"

type Row = { id?: string; in: string; out: string }

/**
 * docs/design-system/components/correction-editor.md. The API corrects one session at a time
 * (add / edit / remove), each with the reason; the day is recalculated and flagged Corrected.
 * ponytail: no live result preview (the API has no dry run); the drawer shows the new status.
 */
export function CorrectionEditor({ detail }: { detail: DayDetail }) {
  const t = useTranslations("attendanceReview.editor")
  const { timezone } = useUser().company
  const reasonId = useId()
  const date = detail.day.date
  const [rows, setRows] = useState<Row[]>(() =>
    detail.sessions.map((session) => ({
      id: session.id,
      in: companyTime(session.in, timezone),
      out: session.out ? companyTime(session.out, timezone) : "",
    }))
  )
  const [reason, setReason] = useState("")
  const [busy, setBusy] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const instant = (time: string) => companyInstant(date, time, timezone)

  async function run(index: number, action: () => Promise<unknown>) {
    if (!reason.trim()) {
      setError(t("reasonFirst"))
      return
    }
    setBusy(index)
    setError(null)
    const problem = (await action()) as { code: string } | undefined
    setBusy(null)
    if (problem) setError(t("failed"))
    else notify.success(t("saved"))
  }

  function save(index: number) {
    const row = rows[index]!
    if (!row.in || (!row.id && !row.out) || (row.out && row.out <= row.in)) {
      setError(t("timesInvalid"))
      return
    }
    void run(index, () =>
      row.id
        ? editSession(row.id, {
            checkInAt: instant(row.in),
            checkOutAt: row.out ? instant(row.out) : null,
            reason: reason.trim(),
          })
        : addSession(detail.employee.id, date, {
            checkInAt: instant(row.in),
            checkOutAt: instant(row.out),
            reason: reason.trim(),
          })
    )
  }

  function remove(index: number) {
    const row = rows[index]!
    if (!row.id) {
      setRows((current) => current.filter((_, at) => at !== index))
      return
    }
    void run(index, () => removeSession(row.id!, reason.trim()))
  }

  const update = (index: number, change: Partial<Row>) =>
    setRows((current) =>
      current.map((row, at) => (at === index ? { ...row, ...change } : row))
    )

  return (
    <section aria-labelledby="correct-title" className="flex flex-col gap-3">
      <h3 id="correct-title" className="text-body-lg font-bold">
        {t("title")}
      </h3>
      <div className="flex flex-col gap-1">
        <label htmlFor={reasonId} className="text-body font-semibold">
          {t("reason")}
        </label>
        <Textarea
          id={reasonId}
          value={reason}
          maxLength={500}
          onChange={(event) => setReason(event.target.value)}
          placeholder={t("reasonHint")}
        />
      </div>
      {rows.map((row, index) => (
        <div
          key={row.id ?? `new-${index}`}
          role="group"
          aria-label={t("session", { index: index + 1 })}
          className="flex flex-wrap items-end gap-2 rounded-md border p-3"
        >
          <div className="w-32">
            <TimeField
              label={t("in")}
              value={row.in || null}
              onChange={(value) => update(index, { in: value ?? "" })}
            />
          </div>
          <div className="w-32">
            <TimeField
              label={t("out")}
              value={row.out || null}
              onChange={(value) => update(index, { out: value ?? "" })}
            />
          </div>
          <div className="ms-auto flex gap-1">
            <Button
              size="sm"
              variant="outline"
              loading={busy === index}
              onClick={() => save(index)}
            >
              <SaveIcon aria-hidden />
              {t("save")}
            </Button>
            <Button
              size="icon-sm"
              variant="ghost"
              className="text-destructive"
              aria-label={t("remove", { index: index + 1 })}
              disabled={busy === index}
              onClick={() => remove(index)}
            >
              <Trash2Icon aria-hidden />
            </Button>
          </div>
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        className="w-fit rounded-pill border-dashed"
        onClick={() => setRows((current) => [...current, { in: "", out: "" }])}
      >
        <PlusIcon aria-hidden />
        {t("add")}
      </Button>
      {error ? (
        <p role="alert" className="text-body-sm text-error">
          {error}
        </p>
      ) : null}
    </section>
  )
}
