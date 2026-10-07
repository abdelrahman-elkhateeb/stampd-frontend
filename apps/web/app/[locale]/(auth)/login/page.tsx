import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"

import { LocaleSwitcher } from "@/components/locale-switcher"
import { LoginForm } from "@/features/auth/login-form"
import type { Locale } from "@/i18n/routing"
import { safeReturnTo } from "@/lib/auth/return-to"
import { serverEnv } from "@/lib/env/server"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.login")
  return { title: t("title") }
}

// Functional placeholder; FE-02 builds the real auth page shell.
export default async function LoginPage({
  params,
  searchParams,
}: PageProps<"/[locale]/login">) {
  const { locale } = await params
  setRequestLocale(locale as Locale)
  const query = await searchParams
  const t = await getTranslations("auth.login")

  const returnTo =
    typeof query.returnTo === "string"
      ? safeReturnTo(query.returnTo)
      : undefined
  const expired = query.reason === "expired"

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-100 flex-col justify-center gap-6 px-4 py-12">
      <h1 className="text-h2 font-bold">{t("title")}</h1>
      {expired ? (
        <p
          role="status"
          className="rounded-md bg-warning-bg px-4 py-3 text-body-sm text-warning"
        >
          {t("expired")}
        </p>
      ) : null}
      <LoginForm returnTo={returnTo} />
      {serverEnv.API_MOCKING ? (
        <p className="text-caption text-muted-foreground">{t("demoHint")}</p>
      ) : null}
      <LocaleSwitcher />
    </main>
  )
}
