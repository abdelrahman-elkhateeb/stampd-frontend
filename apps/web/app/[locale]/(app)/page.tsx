import { getTranslations, setRequestLocale } from "next-intl/server"

import { SetupChecklist } from "@/features/onboarding/setup-checklist"
import type { Locale } from "@/i18n/routing"
import { DEMO_USER } from "@/lib/demo-user"

// Placeholder until FE-09 builds the dashboard.
export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params
  setRequestLocale(locale as Locale)
  const t = await getTranslations("home")

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-h2 font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("body")}</p>
      </div>
      {DEMO_USER.role === "admin" ? (
        <div className="max-w-2xl">
          <SetupChecklist />
        </div>
      ) : null}
    </div>
  )
}
