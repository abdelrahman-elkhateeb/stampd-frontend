"use client"

import { CheckIcon, CircleIcon, EyeIcon, EyeOffIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { useId, useState } from "react"
import {
  Controller,
  type FieldValues,
  type Path,
  type UseFormReturn,
  useWatch,
} from "react-hook-form"

import { Link } from "@/i18n/navigation"
import { checkPasswordRules, passwordStrength } from "@/lib/password"
import { Checkbox } from "@workspace/ui/components/checkbox"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { cn } from "@workspace/ui/lib/utils"

/** The translated error for a field. Messages are codes (see lib/forms.ts), translated here. */
function useFieldError<T extends FieldValues>(
  form: UseFormReturn<T>,
  name: Path<T>,
  id: string
) {
  const t = useTranslations("fieldErrors")
  const error = form.formState.errors[name]
  const code = typeof error?.message === "string" ? error.message : undefined
  return code
    ? {
        id: `${id}-error`,
        text: t.has(code as never) ? t(code as never) : t("INVALID_FORMAT"),
      }
    : undefined
}

function describedBy(...ids: (string | undefined)[]) {
  return ids.filter(Boolean).join(" ") || undefined
}

/** A labelled input wired to react-hook-form, with its error under it, linked by aria-describedby. */
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
  const id = useId()
  const error = useFieldError(form, name, id)
  const descriptionId = description ? `${id}-description` : undefined

  return (
    <Field data-invalid={error ? true : undefined}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(descriptionId, error?.id)}
        {...inputProps}
        {...form.register(name)}
      />
      {description ? (
        <FieldDescription id={descriptionId}>{description}</FieldDescription>
      ) : null}
      {error ? <FieldError id={error.id}>{error.text}</FieldError> : null}
    </Field>
  )
}

const STRENGTH = ["tooWeak", "weak", "fair", "good", "strong"] as const

// docs/design-system/components/password-field.md
export function PasswordField<T extends FieldValues>({
  form,
  name,
  label,
  variant,
  personal = [],
  forgotHref,
}: {
  form: UseFormReturn<T>
  name: Path<T>
  label: string
  /** "new" shows the strength meter and the rules; "current" is for logging in. */
  variant: "new" | "current"
  /** Name and email, which the password must not contain. */
  personal?: string[]
  forgotHref?: string
}) {
  const t = useTranslations("password")
  const id = useId()
  const error = useFieldError(form, name, id)
  const [shown, setShown] = useState(false)
  const [focused, setFocused] = useState(false)
  const [capsLock, setCapsLock] = useState(false)
  const { onBlur, ...field } = form.register(name)
  const value: string = useWatch({ control: form.control, name }) ?? ""

  const rules = checkPasswordRules(value, personal)
  const allMet = Object.values(rules).every(Boolean)
  const score = passwordStrength(value, personal)
  const showRules = variant === "new" && (focused || (value !== "" && !allMet))
  const rulesId = showRules ? `${id}-rules` : undefined
  const capsId = capsLock ? `${id}-caps` : undefined

  return (
    <Field data-invalid={error ? true : undefined}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div className="relative">
        <Input
          id={id}
          type={shown ? "text" : "password"}
          dir="ltr"
          autoComplete={variant === "new" ? "new-password" : "current-password"}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(rulesId, capsId, error?.id)}
          // The input stays LTR in RTL pages, so its own start is where the page toggle sits.
          className={cn(
            "pe-12 rtl:pe-3.5 rtl:ps-12",
            !shown && value && "text-lg tracking-[0.2em]"
          )}
          onFocus={() => setFocused(true)}
          onBlur={(event) => {
            setFocused(false)
            setCapsLock(false)
            return onBlur(event)
          }}
          onKeyUp={(event) => setCapsLock(event.getModifierState("CapsLock"))}
          {...field}
        />
        <button
          type="button"
          aria-label={t("show")}
          aria-pressed={shown}
          onClick={() => setShown(!shown)}
          className="absolute inset-y-0 end-0 flex w-12 items-center justify-center rounded-e-md text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
        >
          {shown ? (
            <EyeOffIcon aria-hidden className="size-5" />
          ) : (
            <EyeIcon aria-hidden className="size-5" />
          )}
        </button>
      </div>

      {capsLock ? (
        <p id={capsId} className="text-body-sm text-warning">
          {t("capsLock")}
        </p>
      ) : null}

      {variant === "new" && value ? (
        <div className="flex items-center gap-3">
          <div aria-hidden className="flex flex-1 gap-1">
            {[1, 2, 3, 4].map((bar) => (
              <span
                key={bar}
                className={cn(
                  "h-1.5 flex-1 rounded-pill border border-input",
                  bar <= score && "border-foreground bg-foreground"
                )}
              />
            ))}
          </div>
          <p aria-live="polite" className="text-caption text-muted-foreground">
            <span className="font-bold text-foreground">
              {t(`strength.${STRENGTH[score]!}`)}
            </span>{" "}
            · {t("scoreOf", { score })}
          </p>
        </div>
      ) : null}

      {showRules ? (
        <ul id={rulesId} className="flex flex-col gap-1 text-body-sm">
          {(["length", "notCommon", "notPersonal"] as const).map((rule) => (
            <li
              key={rule}
              className={cn(
                "flex items-center gap-2",
                rules[rule] ? "text-success" : "text-muted-foreground"
              )}
            >
              {rules[rule] ? (
                <CheckIcon aria-hidden className="size-4" strokeWidth={3} />
              ) : (
                <CircleIcon aria-hidden className="size-4" />
              )}
              {t(`rules.${rule}`)}
              <span className="sr-only">
                {rules[rule] ? t("ruleMet") : t("ruleNotMet")}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      {error ? <FieldError id={error.id}>{error.text}</FieldError> : null}

      {forgotHref ? (
        <Link
          href={forgotHref}
          className="w-fit text-body-sm font-medium underline underline-offset-4"
        >
          {t("forgot")}
        </Link>
      ) : null}
    </Field>
  )
}

/** A checkbox with a clickable label; `label` may hold links. */
export function CheckboxField<T extends FieldValues>({
  form,
  name,
  label,
}: {
  form: UseFormReturn<T>
  name: Path<T>
  label: React.ReactNode
}) {
  const id = useId()
  const error = useFieldError(form, name, id)

  return (
    <Field data-invalid={error ? true : undefined}>
      <div className="flex items-start gap-3">
        <Controller
          control={form.control}
          name={name}
          render={({ field }) => (
            <Checkbox
              id={id}
              ref={field.ref}
              checked={field.value === true}
              onCheckedChange={(checked) => field.onChange(checked === true)}
              onBlur={field.onBlur}
              aria-invalid={error ? true : undefined}
              aria-describedby={error?.id}
              className="mt-0.5"
            />
          )}
        />
        <label htmlFor={id} className={cn("text-body", error && "text-error")}>
          {label}
        </label>
      </div>
      {error ? <FieldError id={error.id}>{error.text}</FieldError> : null}
    </Field>
  )
}
