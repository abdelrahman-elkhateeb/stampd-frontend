"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { TextField } from "@/components/form-fields"
import { useRouter } from "@/i18n/navigation"
import { codeErrorMap } from "@/lib/forms"
import { Button } from "@workspace/ui/components/button"
import { FieldGroup } from "@workspace/ui/components/field"

const LoginBody = z.object({ email: z.email(), password: z.string().min(1) })

export function LoginForm() {
  const t = useTranslations("auth.login")
  const router = useRouter()
  const form = useForm({
    resolver: zodResolver(LoginBody, codeErrorMap),
    defaultValues: { email: "", password: "" },
  })

  // ponytail: no backend yet, a valid form just opens the app. Call the login API here once it exists.
  const onSubmit = form.handleSubmit(() => router.push("/"))

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
      <Button type="submit">{t("submit")}</Button>
    </form>
  )
}
