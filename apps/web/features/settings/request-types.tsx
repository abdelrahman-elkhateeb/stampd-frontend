"use client"

import { useTranslations } from "next-intl"
import { useOptimistic, useTransition } from "react"

import type { RequestType } from "@/features/requests/request-data"
import { useRequestTypeLabel } from "@/features/requests/request-text"
import { Card } from "@workspace/ui/components/card"
import { notify } from "@workspace/ui/components/sonner"
import { Switch } from "@workspace/ui/components/switch"

import { saveSettings } from "./actions"

/** Switches save at once (components/switch.md): no Save button on this page. */
export function RequestTypesPage({
  types,
  disabled,
}: {
  /** Every registered type but leave, turned-off ones included. */
  types: RequestType[]
  disabled: string[]
}) {
  const t = useTranslations("settings.requestTypes")
  const typeLabel = useRequestTypeLabel()
  const [off, setOff] = useOptimistic(disabled)
  const [, startTransition] = useTransition()

  function toggle(key: string, enabled: boolean) {
    const next = enabled ? off.filter((item) => item !== key) : [...off, key]
    startTransition(async () => {
      setOff(next)
      if (await saveSettings({ disabledRequestTypes: next }))
        notify.error(t("failed"))
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-h3 font-bold">{t("title")}</h2>
      <p className="-mt-2 text-body-sm text-muted-foreground">
        {t("description")}
      </p>
      <Card className="max-w-160 gap-0 divide-y py-0">
        {types.map((type) => {
          const enabled = !off.includes(type.key)
          return (
            <div
              key={type.key}
              className="flex min-h-11 items-start gap-4 py-4"
            >
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <label
                  htmlFor={`request-type-${type.key}`}
                  className="text-body font-bold"
                >
                  {typeLabel(type.key)}
                </label>
                <p
                  id={`request-type-${type.key}-description`}
                  className="text-body-sm text-muted-foreground"
                >
                  {t(`approver.${type.approverPolicy}`)}{" "}
                  {enabled ? null : (
                    <span className="font-semibold text-foreground">
                      {t("hidden")}
                    </span>
                  )}
                </p>
              </div>
              <Switch
                id={`request-type-${type.key}`}
                aria-describedby={`request-type-${type.key}-description`}
                checked={enabled}
                onCheckedChange={(checked) => toggle(type.key, checked)}
                className="mt-0.5"
              />
            </div>
          )
        })}
      </Card>
    </div>
  )
}
