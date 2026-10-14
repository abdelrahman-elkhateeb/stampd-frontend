"use client"

import { ArrowLeftIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { parseAsString, useQueryState } from "nuqs"
import { useState } from "react"

import { Link, useRouter } from "@/i18n/navigation"
import { Button } from "@workspace/ui/components/button"
import { CategoryIcon } from "@workspace/ui/components/category-chip"
import { FieldError } from "@workspace/ui/components/field"
import { RadioCard, RadioGroup } from "@workspace/ui/components/radio-group"

import type { EmployeeOption, RequestType } from "./request-data"
import { RequestForm } from "./request-form"
import { categoryOf, useRequestText } from "./request-text"

/** Types with their own screen open it instead of the generic form. */
const FLOWS: Record<string, string> = { LEAVE: "/leave/new" }

/** Only enabled types are offered (FE-08 AC); a disabled or unknown ?type= shows the picker. */
export function NewRequestPage({
  types,
  employees,
}: {
  types: RequestType[]
  employees?: EmployeeOption[]
}) {
  const t = useTranslations("requests")
  const [typeKey, setTypeKey] = useQueryState("type", parseAsString)
  const enabled = types.filter((type) => type.enabled)
  const meta = enabled.find((type) => type.key === typeKey && !FLOWS[type.key])

  return (
    <div className="flex max-w-160 flex-col gap-6">
      <Link
        href={meta ? "/requests/new" : "/requests"}
        onClick={(event) => {
          if (!meta) return
          event.preventDefault()
          void setTypeKey(null)
        }}
        className="inline-flex w-fit items-center gap-1 text-body-sm font-semibold underline-offset-4 hover:underline"
      >
        <ArrowLeftIcon aria-hidden className="flip-rtl size-4" />
        {meta ? t("form.changeType") : t("title")}
      </Link>
      {meta ? (
        <RequestForm key={meta.key} type={meta} employees={employees} />
      ) : (
        <TypePicker types={enabled} onPick={(key) => void setTypeKey(key)} />
      )}
    </div>
  )
}

function TypePicker({
  types,
  onPick,
}: {
  types: RequestType[]
  onPick: (key: string) => void
}) {
  const t = useTranslations("requests")
  const text = useRequestText({ types, leaveTypes: [] })
  const router = useRouter()
  const [selected, setSelected] = useState<string>("")
  const [missing, setMissing] = useState(false)

  function next() {
    const meta = types.find((type) => type.key === selected)
    if (!meta) {
      setMissing(true)
      document.querySelector<HTMLElement>("[data-slot=radio-card]")?.focus()
      return
    }
    // Leave has its own flow (FE-07).
    const flow = FLOWS[meta.key]
    if (flow) router.push(flow)
    else onPick(meta.key)
  }

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        next()
      }}
      className="flex flex-col gap-6"
    >
      <div className="flex flex-col gap-1">
        <h1 id="new-request-title" className="text-h2 font-bold">
          {t("new")}
        </h1>
        <p className="text-muted-foreground">{t("pickType")}</p>
      </div>
      <RadioGroup
        aria-labelledby="new-request-title"
        aria-describedby={missing ? "new-request-error" : undefined}
        aria-invalid={missing || undefined}
        value={selected}
        onValueChange={(value) => {
          setSelected(value)
          setMissing(false)
        }}
      >
        {types.map((type) => (
          <RadioCard key={type.key} value={type.key}>
            <CategoryIcon category={categoryOf(type.key)} />
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="text-body font-bold">
                {text.typeLabel(type.key)}
              </span>
              {/* muted-foreground fails AA on the selected (brand-subtle) card in dark. */}
              <span className="text-body-sm text-muted-foreground in-data-[state=checked]:text-foreground">
                {text.typeDescription(type.key)}
                {type.approverPolicy === "ADMIN_ONLY"
                  ? ` · ${t("form.reviewedByHr")}`
                  : null}
              </span>
            </span>
          </RadioCard>
        ))}
      </RadioGroup>
      {missing ? (
        <FieldError id="new-request-error" className="-mt-3">
          {t("form.pickTypeError")}
        </FieldError>
      ) : null}
      <Button type="submit" className="sm:w-fit">
        {t("continue")}
      </Button>
    </form>
  )
}
