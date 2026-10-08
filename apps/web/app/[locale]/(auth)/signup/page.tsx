import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"

import { AuthCard } from "@/features/auth/auth-card"
import { SignupForm } from "@/features/auth/signup-form"
import type { Locale } from "@/i18n/routing"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.signup")
  return { title: t("title") }
}

export default async function SignupPage({
  params,
}: PageProps<"/[locale]/signup">) {
  setRequestLocale((await params).locale as Locale)
  const t = await getTranslations("auth.signup")

  return (
    <AuthCard title={t("title")} description={t("description")}>
      <SignupForm />
    </AuthCard>
  )
}
