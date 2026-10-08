"use client"

import { useTranslations } from "next-intl"

import { PageTabs } from "@/components/page-tabs"

const TABS = [
  { id: "company", href: "/settings" },
  { id: "holidays", href: "/settings/holidays" },
  { id: "leaveTypes", href: "/settings/leave-types" },
  { id: "requestTypes", href: "/settings/request-types" },
] as const

/** Header and section tabs shared by every settings page. HR/Admin routes are compact. */
export function SettingsLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations("settings")

  return (
    <div data-density="compact" className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-h2 font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>
      <PageTabs
        label={t("sections")}
        tabs={TABS.map((tab) => ({
          href: tab.href,
          label: t(`tabs.${tab.id}`),
        }))}
      />
      {children}
    </div>
  )
}
