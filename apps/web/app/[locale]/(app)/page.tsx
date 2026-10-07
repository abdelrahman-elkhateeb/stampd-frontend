import { getTranslations, setRequestLocale } from "next-intl/server"

import { LocaleSwitcher } from "@/components/locale-switcher"
import type { Locale } from "@/i18n/routing"

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params
  setRequestLocale(locale as Locale)
  const t = await getTranslations("home")

  return (
    <main className="mx-auto flex min-h-svh max-w-md flex-col justify-center gap-4 p-6">
      <h1 className="text-h2 font-bold">{t("title")}</h1>
      <p className="text-muted-foreground">{t("body")}</p>
      <LocaleSwitcher />
    </main>
  )
}
