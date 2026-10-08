import { getTranslations, setRequestLocale } from "next-intl/server"

import type { Locale } from "@/i18n/routing"

// Placeholder until FE-09 builds the dashboard.
export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params
  setRequestLocale(locale as Locale)
  const t = await getTranslations("home")

  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-h2 font-bold">{t("title")}</h1>
      <p className="text-muted-foreground">{t("body")}</p>
    </div>
  )
}
