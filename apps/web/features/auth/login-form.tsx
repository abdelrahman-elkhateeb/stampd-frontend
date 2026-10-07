"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"
import { useTransition } from "react"
import { useForm } from "react-hook-form"

import { LoginBody } from "@/api/generated/zod/auth/auth"
import type { LoginRequest } from "@/api/generated/model"
import { FormAlert, TextField } from "@/components/form-fields"
import { applyFormErrors, codeErrorMap } from "@/lib/forms"
import { Button } from "@workspace/ui/components/button"
import { FieldGroup } from "@workspace/ui/components/field"

import { loginAction } from "./actions"

export function LoginForm({ returnTo }: { returnTo?: string }) {
  const t = useTranslations("auth.login")
  const [pending, startTransition] = useTransition()
  const form = useForm<LoginRequest>({
    resolver: zodResolver(LoginBody, codeErrorMap),
    defaultValues: { email: "", password: "" },
  })

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await loginAction(values, returnTo)
      // Success redirects on the server; anything returned is an error to show.
      if (result) applyFormErrors(form.setError, result)
    })
  })

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <FormAlert form={form} />
      <FieldGroup>
        <TextField
          form={form}
          name="email"
          label={t("email")}
          type="email"
          autoComplete="email"
          inputMode="email"
          dir="ltr"
        />
        <TextField
          form={form}
          name="password"
          label={t("password")}
          type="password"
          autoComplete="current-password"
        />
      </FieldGroup>
      <Button type="submit" loading={pending} loadingLabel={t("submitting")}>
        {t("submit")}
      </Button>
    </form>
  )
}
