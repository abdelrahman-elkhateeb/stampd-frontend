"use client"

import { useTranslations } from "next-intl"
import { TriangleAlertIcon } from "lucide-react"
import { useId } from "react"
import type { FieldValues, Path, UseFormReturn } from "react-hook-form"

import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"

/**
 * A labelled input wired to react-hook-form. Error messages are codes
 * (see lib/forms.ts) and are translated here, under the field, linked by aria-describedby.
 */
export function TextField<T extends FieldValues>({
  form,
  name,
  label,
  description,
  ...inputProps
}: {
  form: UseFormReturn<T>
  name: Path<T>
  label: string
  description?: string
} & Omit<React.ComponentProps<typeof Input>, "name" | "form">) {
  const t = useTranslations("fieldErrors")
  const id = useId()
  const error = form.formState.errors[name]
  const code = typeof error?.message === "string" ? error.message : undefined
  const descriptionId = description ? `${id}-description` : undefined
  const errorId = code ? `${id}-error` : undefined

  return (
    <Field data-invalid={code ? true : undefined}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        aria-invalid={code ? true : undefined}
        aria-describedby={
          [descriptionId, errorId].filter(Boolean).join(" ") || undefined
        }
        {...inputProps}
        {...form.register(name)}
      />
      {description ? (
        <FieldDescription id={descriptionId}>{description}</FieldDescription>
      ) : null}
      {code ? (
        <FieldError id={errorId}>
          {t.has(code as never) ? t(code as never) : t("INVALID_FORMAT")}
        </FieldError>
      ) : null}
    </Field>
  )
}

/** Form-level error (e.g. wrong credentials), announced once. */
export function FormAlert<T extends FieldValues>({
  form,
}: {
  form: UseFormReturn<T>
}) {
  const t = useTranslations("apiErrors")
  const code = form.formState.errors.root?.server?.message
  if (!code) return null

  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-md bg-error-bg px-4 py-3 text-body-sm text-error"
    >
      <TriangleAlertIcon aria-hidden className="mt-0.5 size-4 shrink-0" />
      <span>{t.has(code as never) ? t(code as never) : t("UNKNOWN")}</span>
    </div>
  )
}
