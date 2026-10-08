"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { MailCheckIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { PasswordField, TextField } from "@/components/form-fields"
import { Link, useRouter } from "@/i18n/navigation"
import { codeErrorMap } from "@/lib/forms"
import { NewPassword, passwordRulesIssue } from "@/lib/password"
import { Button } from "@workspace/ui/components/button"
import { FieldGroup } from "@workspace/ui/components/field"
import { notify } from "@workspace/ui/components/sonner"

const ForgotBody = z.object({ email: z.email() })

export function ForgotPasswordForm() {
  const t = useTranslations("auth.forgot")
  const [sentTo, setSentTo] = useState<string>()
  const form = useForm({
    resolver: zodResolver(ForgotBody, codeErrorMap),
    defaultValues: { email: "" },
  })

  // ponytail: no API yet. The same confirmation shows whether or not the account exists.
  const onSubmit = form.handleSubmit(({ email }) => setSentTo(email))

  if (sentTo) {
    return (
      <div role="status" className="flex flex-col gap-4">
        <p className="flex items-start gap-3 rounded-md bg-success-bg p-4 text-body text-foreground">
          <MailCheckIcon
            aria-hidden
            className="mt-0.5 size-5 shrink-0 text-success"
          />
          <span>
            {t.rich("sent", {
              email: sentTo,
              b: (chunks) => <bdi className="font-bold">{chunks}</bdi>,
            })}
          </span>
        </p>
        <BackToLogin />
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <FieldGroup>
        <TextField
          form={form}
          name="email"
          label={t("email")}
          type="email"
          autoComplete="email"
          inputMode="email"
        />
      </FieldGroup>
      <Button type="submit">{t("submit")}</Button>
      <BackToLogin />
    </form>
  )
}

const ResetBody = z
  .object({ password: NewPassword })
  .refine((body) => !passwordRulesIssue(body.password, []), {
    path: ["password"],
    message: "WEAK_PASSWORD",
  })

/** Sets the new password; the user is then logged in (FE-02 AC). */
export function ResetPasswordForm() {
  const t = useTranslations("auth.reset")
  const router = useRouter()
  const form = useForm({
    resolver: zodResolver(ResetBody, codeErrorMap),
    defaultValues: { password: "" },
  })

  const onSubmit = form.handleSubmit(() => {
    notify.success(t("done"))
    router.push("/")
  })

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <FieldGroup>
        <PasswordField
          form={form}
          name="password"
          label={t("password")}
          variant="new"
        />
      </FieldGroup>
      <Button type="submit">{t("submit")}</Button>
    </form>
  )
}

export function BackToLogin() {
  const t = useTranslations("auth")
  return (
    <Link
      href="/login"
      className="w-fit self-center text-body font-bold underline underline-offset-4"
    >
      {t("backToLogin")}
    </Link>
  )
}
