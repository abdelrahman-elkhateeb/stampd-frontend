import { getTranslations } from "next-intl/server"
import { LogOutIcon } from "lucide-react"

import { LocaleSwitcher } from "@/components/locale-switcher"
import { Link } from "@/i18n/navigation"
import { DEMO_USER } from "@/lib/demo-user"
import { Button } from "@workspace/ui/components/button"
import { Wordmark } from "@workspace/ui/components/wordmark"

// Placeholder shell until FE-03 builds the real navigation.
export default async function AppLayout({
  children,
}: LayoutProps<"/[locale]">) {
  const t = await getTranslations()

  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b px-4 py-3">
        <Wordmark>{t("app.name")}</Wordmark>
        <div className="flex items-center gap-3">
          <LocaleSwitcher />
          <span className="hidden text-body-sm text-muted-foreground sm:inline">
            <bdi>{DEMO_USER.name}</bdi>
          </span>
          <Button
            variant="ghost"
            size="sm"
            aria-label={t("auth.logout")}
            asChild
          >
            <Link href="/login">
              <LogOutIcon aria-hidden className="flip-rtl" />
              <span className="hidden sm:inline">{t("auth.logout")}</span>
            </Link>
          </Button>
        </div>
      </header>
      {children}
    </>
  )
}
