"use client"

import { useTranslations } from "next-intl"

import { Link, usePathname } from "@/i18n/navigation"
import { cn } from "@workspace/ui/lib/utils"

const TABS = [
  { id: "company", href: "/settings" },
  { id: "holidays", href: "/settings/holidays" },
  { id: "leaveTypes", href: "/settings/leave-types" },
  { id: "requestTypes", href: "/settings/request-types" },
] as const

/** Header and section tabs shared by every settings page. HR/Admin routes are compact. */
export function SettingsLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations("settings")
  const pathname = usePathname()

  return (
    <div data-density="compact" className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-h2 font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>
      {/* Links styled as page tabs (components/tabs.md); each tab is its own URL. */}
      <nav
        aria-label={t("sections")}
        className="-mt-2 flex items-end gap-1 overflow-x-auto border-b border-border [scrollbar-width:none]"
      >
        {TABS.map((tab) => {
          const active = pathname === tab.href
          return (
            <Link
              key={tab.id}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative inline-flex h-11 shrink-0 items-center rounded-t-sm px-3 text-body font-semibold whitespace-nowrap text-subtle-foreground outline-none",
                "hover:bg-accent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring focus-visible:outline-solid",
                "after:absolute after:inset-x-0 after:bottom-0 after:h-[2.5px] after:bg-foreground after:opacity-0",
                active && "font-bold text-foreground after:opacity-100"
              )}
            >
              {t(`tabs.${tab.id}`)}
            </Link>
          )
        })}
      </nav>
      {children}
    </div>
  )
}
