"use client"

import { useTranslations } from "next-intl"
import { useState } from "react"

import { Card } from "@workspace/ui/components/card"
import { Switch } from "@workspace/ui/components/switch"

import { DEMO_REQUEST_TYPES_ENABLED, REQUEST_TYPES } from "./demo-data"

/** Switches save at once (components/switch.md): no Save button on this page. */
export function RequestTypesPage() {
  const t = useTranslations("settings.requestTypes")
  // ponytail: state only until BE-11; the employee request form (FE-08) reads the real flags.
  const [enabled, setEnabled] = useState(DEMO_REQUEST_TYPES_ENABLED)

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-h3 font-bold">{t("title")}</h2>
      <p className="-mt-2 text-body-sm text-muted-foreground">
        {t("description")}
      </p>
      <Card className="max-w-160 gap-0 divide-y py-0">
        {REQUEST_TYPES.map((type) => (
          <div key={type} className="flex min-h-11 items-start gap-4 py-4">
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <label
                htmlFor={`request-type-${type}`}
                className="text-body font-bold"
              >
                {t(`types.${type}.name`)}
              </label>
              <p
                id={`request-type-${type}-description`}
                className="text-body-sm text-muted-foreground"
              >
                {t(`types.${type}.approver`)}{" "}
                {enabled[type] ? null : (
                  <span className="font-semibold text-foreground">
                    {t("hidden")}
                  </span>
                )}
              </p>
            </div>
            <Switch
              id={`request-type-${type}`}
              aria-describedby={`request-type-${type}-description`}
              checked={enabled[type]}
              onCheckedChange={(checked) =>
                setEnabled((current) => ({ ...current, [type]: checked }))
              }
              className="mt-0.5"
            />
          </div>
        ))}
      </Card>
    </div>
  )
}
