"use client"

import { useTranslations } from "next-intl"

import { PageTabs } from "@/components/page-tabs"

/** Header and tabs for the employee list and departments. HR/Admin routes are compact. */
export function EmployeesLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations("employees")

  return (
    <div data-density="compact" className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-h2 font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>
      <PageTabs
        label={t("sections")}
        tabs={[
          { href: "/employees", label: t("tabs.people") },
          { href: "/employees/departments", label: t("tabs.departments") },
        ]}
      />
      {children}
    </div>
  )
}
