import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"

import { AuthCard } from "@/features/auth/auth-card"
import { safeReturnTo } from "@/features/auth/demo-auth"
import { LoginForm } from "@/features/auth/login-form"
import type { Locale } from "@/i18n/routing"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.login")
  return { title: t("title") }
}

export default async function LoginPage({
  params,
  searchParams,
}: PageProps<"/[locale]/login">) {
  setRequestLocale((await params).locale as Locale)
  const { returnTo, reason } = await searchParams
  const t = await getTranslations("auth.login")

  return (
    <AuthCard
      title={t("title")}
      description={reason === "expired" ? t("sessionExpired") : undefined}
    >
      <LoginForm returnTo={safeReturnTo(returnTo)} />
    </AuthCard>
  )
}
