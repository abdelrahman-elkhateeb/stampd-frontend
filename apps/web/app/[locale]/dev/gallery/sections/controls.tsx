"use client"

import { useTranslations } from "next-intl"
import {
  ArrowRightIcon,
  DownloadIcon,
  LogInIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react"
import { useId, useState } from "react"

import { DateField, DateRangeField, TimeField } from "@/components/pickers"
import { Button } from "@workspace/ui/components/button"
import type { DateRangeValue } from "@workspace/ui/components/date-picker"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"

import { Demo } from "../demo"

const HOLIDAYS = [{ date: "2026-10-22", name: "Company day off" }]

function LabelledInput({
  label,
  description,
  error,
  ...props
}: React.ComponentProps<typeof Input> & {
  label: string
  description?: string
  error?: string
}) {
  const id = useId()
  return (
    <Field data-invalid={error ? true : undefined} className="w-72">
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={
          error ? `${id}-error` : description ? `${id}-description` : undefined
        }
        {...props}
      />
      {description ? (
        <FieldDescription id={`${id}-description`}>
          {description}
        </FieldDescription>
      ) : null}
      {error ? <FieldError id={`${id}-error`}>{error}</FieldError> : null}
    </Field>
  )
}

function LabelledSelect({
  label,
  error,
  disabled,
}: {
  label: string
  error?: string
  disabled?: boolean
}) {
  const t = useTranslations("status")
  const id = useId()
  return (
    <Field data-invalid={error ? true : undefined} className="w-72">
      <FieldLabel id={id}>{label}</FieldLabel>
      <Select disabled={disabled}>
        <SelectTrigger
          aria-labelledby={id}
          aria-invalid={error ? true : undefined}
        >
          <SelectValue placeholder="Choose…" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="present">{t("present")}</SelectItem>
          <SelectItem value="late">{t("late")}</SelectItem>
          <SelectItem value="wfh">{t("wfh")}</SelectItem>
          <SelectItem value="out" disabled>
            {t("out")}
          </SelectItem>
        </SelectContent>
      </Select>
      {error ? <FieldError>{error}</FieldError> : null}
    </Field>
  )
}

export function ControlsSection() {
  const [loading, setLoading] = useState(false)
  const [date, setDate] = useState<string | null>("2026-10-07")
  const [range, setRange] = useState<DateRangeValue>({
    from: "2026-10-18",
    to: "2026-10-22",
  })
  const [time, setTime] = useState<string | null>("08:02")
  const tErrors = useTranslations("fieldErrors")

  return (
    <div className="flex flex-col gap-8">
      <Demo title="Button · variants">
        <Button variant="brand" size="hero" leadingIcon={LogInIcon}>
          Check in
        </Button>
        <Button>Approve</Button>
        <Button variant="secondary" leadingIcon={DownloadIcon}>
          Export CSV
        </Button>
        <Button variant="outline">Cancel</Button>
        <Button variant="ghost" trailingIcon={ArrowRightIcon} flipTrailingIcon>
          View all
        </Button>
        <Button variant="destructive" leadingIcon={Trash2Icon}>
          Delete holiday
        </Button>
        <Button variant="link">Leave policy</Button>
      </Demo>

      <Demo title="Button · sizes">
        <Button size="sm" leadingIcon={PlusIcon}>
          New request
        </Button>
        <Button size="xs" variant="outline">
          Edit
        </Button>
        <Button size="icon" variant="outline" aria-label="Add">
          <PlusIcon aria-hidden />
        </Button>
      </Demo>

      <Demo title="Button · loading and disabled">
        <Button
          loading={loading}
          loadingLabel="Saving…"
          onClick={() => {
            setLoading(true)
            window.setTimeout(() => setLoading(false), 2000)
          }}
        >
          Save changes
        </Button>
        <Button loading loadingLabel="Checking in…" variant="brand">
          Check in
        </Button>
        <Button disabledReason="Add at least one employee first">
          Send invite
        </Button>
        <Button disabled variant="outline">
          Disabled
        </Button>
      </Demo>

      <Demo title="Input · states">
        <LabelledInput
          label="Employee code"
          placeholder="EMP-0142"
          description="For example EMP-0142"
        />
        <LabelledInput label="Name" defaultValue="Sara Al-Harbi" />
        <LabelledInput
          label="Work email"
          type="email"
          defaultValue="sara@"
          error={tErrors("INVALID_FORMAT")}
        />
        <LabelledInput
          label="Company"
          defaultValue="Demo Trading Co."
          disabled
          description="Set by HR"
        />
        <LabelledInput
          label="Employee ID"
          defaultValue="EMP-0142"
          readOnly
          description="Change it in People"
        />
      </Demo>

      <Demo title="Select · states">
        <LabelledSelect label="Status" />
        <LabelledSelect label="Status" error={tErrors("REQUIRED")} />
        <LabelledSelect label="Status" disabled />
      </Demo>

      <Demo title="Date picker, date range and time (company calendar: Sun–Thu, 22 Oct off)">
        <div className="w-72">
          <DateField
            label="Attendance day"
            value={date}
            onChange={setDate}
            holidays={HOLIDAYS}
          />
        </div>
        <div className="w-72">
          <DateRangeField
            label="Leave dates"
            value={range}
            onChange={setRange}
            holidays={HOLIDAYS}
            summary="3 working days · excludes Thu 22 Oct (company day off)"
          />
        </div>
        <div className="w-72">
          <TimeField
            label="Check-in"
            value={time}
            onChange={setTime}
            zoneLabel="AST"
          />
        </div>
        <div className="w-72">
          <DateField
            label="Joining date"
            value={null}
            onChange={() => {}}
            error={tErrors("REQUIRED")}
          />
        </div>
        <div className="w-72">
          <TimeField
            label="Check-out"
            value={null}
            onChange={() => {}}
            disabled
          />
        </div>
      </Demo>
    </div>
  )
}
