"use client"

import {
  BellIcon,
  CalendarDaysIcon,
  ChartColumnIcon,
  ChevronRightIcon,
  CircleUserIcon,
  ClipboardCheckIcon,
  FileTextIcon,
  FingerprintIcon,
  IdCardIcon,
  InboxIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  MoonIcon,
  SettingsIcon,
  SunIcon,
  UmbrellaIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react"
import { useLocale, useTranslations, type Messages } from "next-intl"
import { useTheme } from "next-themes"

import { LocaleSwitcher } from "@/components/locale-switcher"
import { logout } from "@/features/auth/actions"
import { getDirection } from "@/i18n/locale"
import { Link, usePathname } from "@/i18n/navigation"
import type { Locale } from "@/i18n/routing"
import { canAccess, matchesPath } from "@/lib/access"
import { DEMO_USER } from "@/lib/demo-user"
import { useFormat } from "@/lib/use-format"
import { PersonAvatar } from "@workspace/ui/components/avatar"
import { CountBadge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import type { PlainDate } from "@workspace/ui/components/date-picker"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import { cn } from "@workspace/ui/lib/utils"

// docs/design-system/layout.md › Shells, components/sidebar-nav.md, top-bar.md, bottom-nav.md

type NavId = Exclude<keyof Messages["nav"], "main" | "withCount" | "section">
type NavItem = { id: NavId; href: string; icon: LucideIcon; count?: number }

const user = DEMO_USER

const ALL_SECTIONS: {
  id: keyof Messages["nav"]["section"]
  items: NavItem[]
}[] = [
  {
    id: "me",
    items: [
      { id: "dashboard", href: "/", icon: LayoutDashboardIcon },
      { id: "attendance", href: "/attendance", icon: FingerprintIcon },
      { id: "leave", href: "/leave", icon: UmbrellaIcon },
      { id: "requests", href: "/requests", icon: FileTextIcon },
      { id: "calendar", href: "/calendar", icon: CalendarDaysIcon },
    ],
  },
  {
    id: "team",
    items: [
      {
        id: "approvals",
        href: "/approvals",
        icon: InboxIcon,
        count: user.counts.approvals,
      },
      { id: "myTeam", href: "/team", icon: UsersIcon },
    ],
  },
  {
    id: "company",
    items: [
      { id: "employees", href: "/employees", icon: IdCardIcon },
      {
        id: "attendanceReview",
        href: "/attendance-review",
        icon: ClipboardCheckIcon,
      },
      { id: "reports", href: "/reports", icon: ChartColumnIcon },
      { id: "settings", href: "/settings", icon: SettingsIcon },
    ],
  },
]

// lib/access.ts decides what the role sees; sections left empty are hidden.
const SECTIONS = ALL_SECTIONS.map((section) => ({
  ...section,
  items: section.items.filter((item) => canAccess(user.role, item.href)),
})).filter((section) => section.items.length > 0)

// The rest of the nav lives under "Me" on mobile (MoreNav).
const BOTTOM_ITEMS: NavItem[] = [
  { id: "home", href: "/", icon: LayoutDashboardIcon },
  { id: "requests", href: "/requests", icon: FileTextIcon },
  user.role === "employee"
    ? { id: "calendar", href: "/calendar", icon: CalendarDaysIcon }
    : {
        id: "approvals",
        href: "/approvals",
        icon: InboxIcon,
        count: user.counts.approvals,
      },
  { id: "me", href: "/me", icon: CircleUserIcon },
]

function useItemLabel() {
  const t = useTranslations("nav")
  return (item: NavItem) =>
    item.count
      ? t("withCount", { label: t(item.id), count: item.count })
      : t(item.id)
}

/** 240px at xl, a 64px icon rail with tooltips from md to xl, hidden on mobile. */
export function AppSidebar() {
  const t = useTranslations("nav")
  const tRole = useTranslations("roles")
  const label = useItemLabel()
  const pathname = usePathname()
  const rtl = getDirection(useLocale() as Locale) === "rtl"

  return (
    <aside className="sticky top-0 hidden h-svh w-16 shrink-0 flex-col gap-6 overflow-y-auto border-e border-sidebar-border bg-sidebar px-3 py-4 text-sidebar-foreground md:flex xl:w-60">
      <div className="flex items-center gap-3 xl:px-1">
        <span
          aria-hidden
          className="flex size-8 shrink-0 items-center justify-center rounded-md bg-inverse text-caption font-bold text-inverse-foreground ring-2 ring-tenant ring-offset-2 ring-offset-sidebar"
        >
          {user.company.name.charAt(0)}
        </span>
        <span className="sr-only min-w-0 xl:not-sr-only">
          <span className="block truncate text-body font-bold text-foreground">
            {user.company.name}
          </span>
          <span className="block truncate text-caption">
            {tRole(user.role)}
          </span>
        </span>
      </div>

      <nav aria-label={t("main")} className="flex flex-col gap-5">
        {SECTIONS.map((section) => (
          <div
            key={section.id}
            role="group"
            aria-labelledby={`nav-${section.id}`}
            className="flex flex-col gap-1"
          >
            <h2
              id={`nav-${section.id}`}
              className="label-overline sr-only px-3 pb-1 xl:not-sr-only"
            >
              {t(`section.${section.id}`)}
            </h2>
            {section.items.map((item) => {
              const active = matchesPath(pathname, item.href)
              return (
                <Tooltip key={item.id}>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      aria-label={label(item)}
                      className={cn(
                        "relative flex h-control-sm items-center justify-center gap-3 rounded-pill text-body font-medium outline-none hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-sidebar-ring xl:justify-start xl:px-3",
                        active &&
                          "bg-sidebar-primary font-bold text-sidebar-primary-foreground shadow-[inset_0_0_0_1.5px_var(--border-strong)] hover:bg-sidebar-primary hover:text-sidebar-primary-foreground"
                      )}
                    >
                      <item.icon aria-hidden className="size-5 shrink-0" />
                      <span aria-hidden className="hidden truncate xl:inline">
                        {t(item.id)}
                      </span>
                      {item.count ? (
                        <>
                          <CountBadge
                            count={item.count}
                            className="ms-auto hidden xl:inline-flex"
                          />
                          <span
                            aria-hidden
                            className="absolute end-2 top-2 size-2 rounded-pill bg-status-absent xl:hidden"
                          />
                        </>
                      ) : null}
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent
                    side={rtl ? "left" : "right"}
                    className="xl:hidden"
                  >
                    {label(item)}
                  </TooltipContent>
                </Tooltip>
              )
            })}
          </div>
        ))}
      </nav>
    </aside>
  )
}

/** Mobile only: 4 items, labels always on. */
export function BottomNav() {
  const t = useTranslations("nav")
  const label = useItemLabel()
  const pathname = usePathname()

  return (
    <nav
      aria-label={t("main")}
      className="fixed inset-x-0 bottom-0 z-30 grid h-[calc(4.5rem+env(safe-area-inset-bottom))] grid-cols-4 border-t bg-card pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      {BOTTOM_ITEMS.map((item) => {
        const active = matchesPath(pathname, item.href)
        return (
          <Link
            key={item.id}
            href={item.href}
            aria-current={active ? "page" : undefined}
            aria-label={label(item)}
            className="group flex flex-col items-center justify-center gap-1 text-caption font-medium text-subtle-foreground outline-none aria-[current=page]:font-bold aria-[current=page]:text-foreground"
          >
            <span className="relative flex h-[1.875rem] w-14 items-center justify-center rounded-pill group-focus-visible:outline-2 group-focus-visible:outline-ring group-aria-[current=page]:bg-brand group-aria-[current=page]:text-brand-foreground group-aria-[current=page]:shadow-[inset_0_0_0_1.5px_var(--border-strong)]">
              <item.icon aria-hidden className="size-5" />
              {item.count ? (
                <CountBadge
                  count={item.count}
                  max={9}
                  variant="alert"
                  className="absolute end-2 -top-1"
                />
              ) : null}
            </span>
            <span aria-hidden>{t(item.id)}</span>
          </Link>
        )
      })}
    </nav>
  )
}

function companyToday(): PlainDate {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: user.company.timezone,
  }).format(new Date()) as PlainDate
}

export function TopBar() {
  const t = useTranslations("topBar")
  const tNav = useTranslations("nav")
  const format = useFormat()
  const pathname = usePathname()
  const home = pathname === "/"
  const current = SECTIONS.flatMap((section) => section.items).find((item) =>
    matchesPath(pathname, item.href)
  )
  const title = current
    ? tNav(current.id)
    : matchesPath(pathname, "/me")
      ? tNav("profile")
      : ""

  return (
    <header
      className={cn(
        "top-0 z-20 flex h-16 shrink-0 items-center gap-3 border-b bg-background px-4 md:sticky md:px-6 lg:px-8",
        // Flat on the mobile dashboard, sticky everywhere else.
        !home && "sticky",
        home && "max-md:border-b-0"
      )}
    >
      <div className="min-w-0 flex-1">
        {home ? (
          <div className="md:hidden">
            <p className="truncate text-h4 font-bold">
              {t("greeting", { name: user.name.split(" ")[0]! })}
            </p>
            <p className="truncate text-caption text-muted-foreground">
              {format.day(companyToday(), "long")}
            </p>
          </div>
        ) : null}
        {/* Context only: each page owns its h1 in the page header. */}
        <p
          className={cn("truncate text-h4 font-bold", home && "max-md:hidden")}
        >
          {title}
        </p>
      </div>

      <LocaleSwitcher className="hidden md:flex" />
      <ThemeToggle />
      <NotificationBell />
      <UserMenu />
    </header>
  )
}

function ThemeToggle() {
  const t = useTranslations("theme")
  const { resolvedTheme, setTheme } = useTheme()
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={t("toggle")}
      className="hidden md:inline-flex"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      {/* CSS picks the icon, so the server render needs no theme. */}
      <MoonIcon aria-hidden className="dark:hidden" />
      <SunIcon aria-hidden className="hidden dark:block" />
    </Button>
  )
}

// ponytail: links to /notifications; the popover with items arrives with FE-15.
function NotificationBell() {
  const t = useTranslations("topBar")
  const count = user.counts.notifications
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      className="relative max-md:size-11"
      aria-label={t("notifications", { count })}
      asChild
    >
      <Link href="/notifications">
        <BellIcon aria-hidden />
        <CountBadge
          count={count}
          max={9}
          variant="alert"
          className="absolute -end-0.5 -top-0.5"
        />
      </Link>
    </Button>
  )
}

/** Desktop only; on mobile the account lives under "Me". */
function UserMenu() {
  const t = useTranslations()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t("topBar.accountMenu")}
        className="hidden rounded-pill outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background md:inline-flex"
      >
        <PersonAvatar name={user.name} userId={user.id} size={32} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-auto min-w-56">
        <DropdownMenuLabel className="flex items-center gap-3">
          <PersonAvatar name={user.name} userId={user.id} size={40} />
          <span className="min-w-0">
            <span className="block truncate text-body font-bold">
              <bdi>{user.name}</bdi>
            </span>
            <span className="block truncate text-caption text-muted-foreground">
              {user.email}
            </span>
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/me">
            <CircleUserIcon aria-hidden />
            {t("nav.profile")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <ThemeMenuGroup />
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={() => logout()}>
          <LogOutIcon aria-hidden className="flip-rtl" />
          {t("auth.logout")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export const THEMES = ["system", "light", "dark"] as const

function ThemeMenuGroup() {
  const t = useTranslations("theme")
  const { theme = "system", setTheme } = useTheme()
  return (
    <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
      <DropdownMenuLabel className="label-overline">
        {t("label")}
      </DropdownMenuLabel>
      {THEMES.map((value) => (
        <DropdownMenuRadioItem key={value} value={value}>
          {t(value)}
        </DropdownMenuRadioItem>
      ))}
    </DropdownMenuRadioGroup>
  )
}

/** Mobile only, on the Me page: every nav item the bottom bar doesn't carry. */
export function MoreNav() {
  const t = useTranslations("nav")
  const label = useItemLabel()
  const bottom = new Set(BOTTOM_ITEMS.map((item) => item.href))
  const sections = SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => !bottom.has(item.href)),
  })).filter((section) => section.items.length > 0)

  return (
    <nav aria-label={t("more")} className="flex flex-col gap-5 md:hidden">
      {sections.map((section) => (
        <div
          key={section.id}
          role="group"
          aria-labelledby={`more-${section.id}`}
          className="flex flex-col"
        >
          <h2 id={`more-${section.id}`} className="label-overline pb-2">
            {t(`section.${section.id}`)}
          </h2>
          <ul className="divide-y overflow-hidden rounded-lg border bg-card">
            {section.items.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.href}
                  aria-label={label(item)}
                  className="flex min-h-12 items-center gap-3 px-4 text-body font-medium outline-none hover:bg-accent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
                >
                  <item.icon aria-hidden className="size-5 shrink-0" />
                  <span aria-hidden className="flex-1 truncate">
                    {t(item.id)}
                  </span>
                  {item.count ? <CountBadge count={item.count} /> : null}
                  <ChevronRightIcon
                    aria-hidden
                    className="flip-rtl size-4 text-subtle-foreground"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  )
}
