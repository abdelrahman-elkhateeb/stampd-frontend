"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"
import { useForm, useWatch } from "react-hook-form"
import { z } from "zod"

import { PasswordField, TextField } from "@/components/form-fields"
import { useRouter } from "@/i18n/navigation"
import { codeErrorMap, showProblem } from "@/lib/forms"
import { NewPassword, passwordRulesIssue } from "@/lib/password"
import { Button } from "@workspace/ui/components/button"
import { ErrorState } from "@workspace/ui/components/error-state"
import { FieldGroup } from "@workspace/ui/components/field"

import { acceptInvite } from "./actions"

export function InviteForm({
  token,
  name,
  email,
}: {
  token: string
  name: string
  email: string
}) {
  const t = useTranslations("auth.invite")
  const tAuth = useTranslations("auth")
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

  const onSubmit = form.handleSubmit(async (values) => {
    const problem = await acceptInvite(token, values)
    // Employees land on their dashboard (FE-02 AC).
    if (!problem) router.push("/")
    // Expired or used meanwhile: the page re-renders with the explanation.
    else if (problem.code.startsWith("TOKEN_")) router.refresh()
    else showProblem(form, problem)
  })

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      {form.formState.errors.root ? (
        <ErrorState variant="inline" title={tAuth("unavailable")} />
      ) : null}
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
      <Button type="submit" loading={form.formState.isSubmitting}>
        {t("submit")}
      </Button>
    </form>
  )
}
