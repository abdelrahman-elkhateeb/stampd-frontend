"use client"

import { Link, usePathname } from "@/i18n/navigation"
import { cn } from "@workspace/ui/lib/utils"

/** Links styled as page tabs (components/tabs.md); each tab is its own URL. */
export function PageTabs({
  label,
  tabs,
}: {
  label: string
  tabs: { href: string; label: string }[]
}) {
  const pathname = usePathname()

  return (
    <nav
      aria-label={label}
      className="-mt-2 flex items-end gap-1 overflow-x-auto border-b border-border [scrollbar-width:none]"
    >
      {tabs.map((tab) => {
        const active = pathname === tab.href
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative inline-flex h-11 shrink-0 items-center rounded-t-sm px-3 text-body font-semibold whitespace-nowrap text-subtle-foreground outline-none",
              "hover:bg-accent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring focus-visible:outline-solid",
              "after:absolute after:inset-x-0 after:bottom-0 after:h-[2.5px] after:bg-foreground after:opacity-0",
              active && "font-bold text-foreground after:opacity-100"
            )}
          >
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
