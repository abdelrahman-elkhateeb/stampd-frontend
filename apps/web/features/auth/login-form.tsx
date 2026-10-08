"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { PasswordField, TextField } from "@/components/form-fields"
import { Link, useRouter } from "@/i18n/navigation"
import { codeErrorMap } from "@/lib/forms"
import { Button } from "@workspace/ui/components/button"
import { ErrorState } from "@workspace/ui/components/error-state"
import { FieldGroup } from "@workspace/ui/components/field"

import { demoLogin, type LoginResult } from "./demo-auth"

const LoginBody = z.object({ email: z.email(), password: z.string().min(1) })

export function LoginForm({ returnTo }: { returnTo: string }) {
  const t = useTranslations("auth.login")
  const router = useRouter()
  const [failure, setFailure] = useState<Exclude<LoginResult, "ok">>()
  const form = useForm({
    resolver: zodResolver(LoginBody, codeErrorMap),
    defaultValues: { email: "", password: "" },
  })

  const onSubmit = form.handleSubmit(({ email }) => {
    const result = demoLogin(email)
    if (result === "ok") router.push(returnTo)
    else setFailure(result)
  })

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      {failure ? (
        <ErrorState variant="inline" title={t(`errors.${failure}`)} />
      ) : null}
      <FieldGroup>
        <TextField
          form={form}
          name="email"
          label={t("email")}
          type="email"
          autoComplete="email"
          inputMode="email"
        />
        <PasswordField
          form={form}
          name="password"
          label={t("password")}
          variant="current"
          forgotHref="/forgot-password"
        />
      </FieldGroup>
      <Button type="submit">{t("submit")}</Button>
      <p className="text-center text-body text-muted-foreground">
        {t("newCompany")}{" "}
        <Link
          href="/signup"
          className="font-bold text-foreground underline underline-offset-4"
        >
          {t("signUp")}
        </Link>
      </p>
    </form>
  )
}
