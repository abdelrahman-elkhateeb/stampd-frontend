import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"

import { AuthCard } from "@/features/auth/auth-card"
import { isResetTokenValid } from "@/features/auth/auth-api"
import { ResetPasswordForm } from "@/features/auth/password-forms"
import { Link } from "@/i18n/navigation"
import type { Locale } from "@/i18n/routing"
import { Button } from "@workspace/ui/components/button"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.reset")
  return { title: t("title") }
}

export default async function ResetPasswordPage({
  params,
}: PageProps<"/[locale]/reset-password/[token]">) {
  const { locale, token } = await params
  setRequestLocale(locale as Locale)
  const t = await getTranslations("auth.reset")

  if (!(await isResetTokenValid(token))) {
    return (
      <AuthCard title={t("expiredTitle")} description={t("expiredBody")}>
        <Button asChild>
          <Link href="/forgot-password">{t("newLink")}</Link>
        </Button>
      </AuthCard>
    )
  }

  return (
    <AuthCard title={t("title")} description={t("description")}>
      <ResetPasswordForm token={token} />
    </AuthCard>
  )
}
