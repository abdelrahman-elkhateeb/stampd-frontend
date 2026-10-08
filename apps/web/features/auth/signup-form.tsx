"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"
import { useEffect, useId, useSyncExternalStore } from "react"
import { useForm, useWatch } from "react-hook-form"
import { z } from "zod"

import {
  CheckboxField,
  PasswordField,
  TextField,
} from "@/components/form-fields"
import { Link, useRouter } from "@/i18n/navigation"
import { codeErrorMap } from "@/lib/forms"
import { NewPassword, passwordRulesIssue } from "@/lib/password"
import { Button } from "@workspace/ui/components/button"
import { Field, FieldGroup, FieldLabel } from "@workspace/ui/components/field"
import { inputClassName } from "@workspace/ui/components/input"

import { isRegistered } from "./demo-auth"

const SignupBody = z
  .object({
    companyName: z.string().trim().min(2).max(80),
    name: z.string().trim().min(2).max(80),
    email: z.email(),
    password: NewPassword,
    timezone: z.string().min(1),
    terms: z.boolean().refine(Boolean, { message: "MUST_ACCEPT" }),
  })
  .refine(
    (body) => !passwordRulesIssue(body.password, [body.name, body.email]),
    {
      path: ["password"],
      message: "WEAK_PASSWORD",
    }
  )

// Shown until the browser's own zone is known.
const FALLBACK_ZONE = "Asia/Riyadh"
const SERVER_ZONES = [FALLBACK_ZONE]
const noSubscribe = () => () => {}
let cachedZones: string[] | undefined

// Node and the browser can list different zones, so the full list is client-only,
// with the browser's own zone first.
function browserZones() {
  if (!cachedZones) {
    const own = Intl.DateTimeFormat().resolvedOptions().timeZone
    cachedZones = [
      own,
      ...Intl.supportedValuesOf("timeZone").filter((zone) => zone !== own),
    ]
  }
  return cachedZones
}

export function SignupForm() {
  const t = useTranslations("auth.signup")
  const router = useRouter()
  const timezoneId = useId()
  const form = useForm({
    resolver: zodResolver(SignupBody, codeErrorMap),
    defaultValues: {
      companyName: "",
      name: "",
      email: "",
      password: "",
      timezone: FALLBACK_ZONE,
      terms: false,
    },
  })

  const zones = useSyncExternalStore(
    noSubscribe,
    browserZones,
    () => SERVER_ZONES
  )

  // Select the browser's zone once its <option> exists.
  useEffect(() => {
    if (zones.length > 1) form.setValue("timezone", zones[0]!)
  }, [form, zones])

  const onSubmit = form.handleSubmit(({ email }) => {
    if (isRegistered(email)) {
      form.setError("email", { message: "EMAIL_TAKEN" })
      return
    }
    // The new admin lands on the dashboard, where the setup checklist waits.
    router.push("/")
  })

  const [name, email] = useWatch({
    control: form.control,
    name: ["name", "email"],
  })

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <FieldGroup>
        <TextField
          form={form}
          name="companyName"
          label={t("companyName")}
          autoComplete="organization"
        />
        <TextField
          form={form}
          name="name"
          label={t("name")}
          autoComplete="name"
        />
        <div className="flex flex-col gap-1.5">
          <TextField
            form={form}
            name="email"
            label={t("email")}
            type="email"
            autoComplete="email"
            inputMode="email"
          />
          {form.formState.errors.email?.message === "EMAIL_TAKEN" ? (
            <Link
              href="/login"
              className="w-fit text-body-sm font-bold underline underline-offset-4"
            >
              {t("logInInstead")}
            </Link>
          ) : null}
        </div>
        <PasswordField
          form={form}
          name="password"
          label={t("password")}
          variant="new"
          personal={[name, email]}
        />
        <Field>
          <FieldLabel htmlFor={timezoneId}>{t("timezone")}</FieldLabel>
          {/* Native select: ~400 zones, with the platform's own typeahead. */}
          <select
            id={timezoneId}
            dir="ltr"
            className={inputClassName}
            {...form.register("timezone")}
          >
            {zones.map((zone) => (
              <option key={zone} value={zone}>
                {zone.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </Field>
        <CheckboxField
          form={form}
          name="terms"
          label={t.rich("terms", {
            terms: (chunks) => <DocLink href="/terms">{chunks}</DocLink>,
            privacy: (chunks) => <DocLink href="/privacy">{chunks}</DocLink>,
          })}
        />
      </FieldGroup>
      <Button type="submit">{t("submit")}</Button>
      <p className="text-center text-body text-muted-foreground">
        {t("haveAccount")}{" "}
        <Link
          href="/login"
          className="font-bold text-foreground underline underline-offset-4"
        >
          {t("logIn")}
        </Link>
      </p>
    </form>
  )
}

// ponytail: /terms and /privacy 404 until the legal documents exist.
function DocLink({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      target="_blank"
      className="font-bold underline underline-offset-4"
    >
      {children}
    </Link>
  )
}
