import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"

import { LocaleSwitcher } from "@/components/locale-switcher"
import { LoginForm } from "@/features/auth/login-form"
import type { Locale } from "@/i18n/routing"
import { Wordmark } from "@workspace/ui/components/wordmark"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.login")
  return { title: t("title") }
}

// Functional placeholder; FE-02 builds the real auth page shell.
export default async function LoginPage({
  params,
}: PageProps<"/[locale]/login">) {
  setRequestLocale((await params).locale as Locale)
  const t = await getTranslations("auth.login")
  const tApp = await getTranslations("app")

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-100 flex-col justify-center gap-6 px-4 py-12">
      <Wordmark className="self-start">{tApp("name")}</Wordmark>
      <h1 className="text-h2 font-bold">{t("title")}</h1>
      <LoginForm />
      <LocaleSwitcher />
    </main>
  )
}
