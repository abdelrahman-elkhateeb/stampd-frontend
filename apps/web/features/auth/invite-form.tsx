"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"
import { useForm, useWatch } from "react-hook-form"
import { z } from "zod"

import { PasswordField, TextField } from "@/components/form-fields"
import { useRouter } from "@/i18n/navigation"
import { codeErrorMap } from "@/lib/forms"
import { NewPassword, passwordRulesIssue } from "@/lib/password"
import { Button } from "@workspace/ui/components/button"
import { FieldGroup } from "@workspace/ui/components/field"

export function InviteForm({ name, email }: { name: string; email: string }) {
  const t = useTranslations("auth.invite")
  const router = useRouter()
  const form = useForm({
    resolver: zodResolver(
      z
        .object({
          name: z.string().trim().min(2).max(80),
          password: NewPassword,
        })
        .refine(
          (body) => !passwordRulesIssue(body.password, [body.name, email]),
          {
            path: ["password"],
            message: "WEAK_PASSWORD",
          }
        ),
      codeErrorMap
    ),
    defaultValues: { name, password: "" },
  })

  const currentName = useWatch({ control: form.control, name: "name" })

  // Employees land on their dashboard (FE-02 AC).
  const onSubmit = form.handleSubmit(() => router.push("/"))

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <FieldGroup>
        <div className="flex flex-col gap-1">
          <p className="text-body font-medium">{t("email")}</p>
          <p dir="ltr" className="text-body text-muted-foreground rtl:text-end">
            {email}
          </p>
        </div>
        <TextField
          form={form}
          name="name"
          label={t("name")}
          description={t("nameHint")}
          autoComplete="name"
        />
        <PasswordField
          form={form}
          name="password"
          label={t("password")}
          variant="new"
          personal={[currentName, email]}
        />
      </FieldGroup>
      <Button type="submit">{t("submit")}</Button>
    </form>
  )
}
