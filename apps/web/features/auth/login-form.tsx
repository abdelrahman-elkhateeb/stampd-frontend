"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { PasswordField, TextField } from "@/components/form-fields"
import { Link, useRouter } from "@/i18n/navigation"
import { codeErrorMap, showProblem } from "@/lib/forms"
import { Button } from "@workspace/ui/components/button"
import { ErrorState } from "@workspace/ui/components/error-state"
import { FieldGroup } from "@workspace/ui/components/field"

import { login } from "./actions"

const LoginBody = z.object({ email: z.email(), password: z.string().min(1) })

const FAILURES = {
  INVALID_CREDENTIALS: "login.errors.incorrect",
  ACCOUNT_DEACTIVATED: "login.errors.deactivated",
  TOO_MANY_ATTEMPTS: "login.errors.locked",
} as const

export function LoginForm({ returnTo }: { returnTo: string }) {
  const t = useTranslations("auth.login")
  const tAuth = useTranslations("auth")
  const router = useRouter()
  const form = useForm({
    resolver: zodResolver(LoginBody, codeErrorMap),
    defaultValues: { email: "", password: "" },
  })

  const onSubmit = form.handleSubmit(async (values) => {
    const problem = await login(values)
    if (problem) showProblem(form, problem)
    else router.push(returnTo)
  })
  const failure = form.formState.errors.root?.message

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      {failure ? (
        <ErrorState
          variant="inline"
          title={tAuth(
            FAILURES[failure as keyof typeof FAILURES] ?? "unavailable"
          )}
        />
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
      <Button type="submit" loading={form.formState.isSubmitting}>
        {t("submit")}
      </Button>
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
