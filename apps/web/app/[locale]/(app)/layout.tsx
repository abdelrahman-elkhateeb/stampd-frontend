import { getTranslations } from "next-intl/server"
import { LogOutIcon } from "lucide-react"

import { CurrentUserProvider } from "@/components/current-user-provider"
import { LocaleSwitcher } from "@/components/locale-switcher"
import { logoutAction } from "@/features/auth/actions"
import { getCurrentUser } from "@/lib/current-user"
import { Button } from "@workspace/ui/components/button"
import { Wordmark } from "@workspace/ui/components/wordmark"

// Placeholder shell until FE-03 builds the real navigation.
export default async function AppLayout({
  children,
}: LayoutProps<"/[locale]">) {
  const user = await getCurrentUser()
  const t = await getTranslations()

  return (
    <CurrentUserProvider user={user}>
      <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b px-4 py-3">
        <Wordmark>{t("app.name")}</Wordmark>
        <div className="flex items-center gap-3">
          <LocaleSwitcher />
          <span className="hidden text-body-sm text-muted-foreground sm:inline">
            <bdi>{user.name}</bdi>
          </span>
          <form action={logoutAction}>
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              aria-label={t("auth.logout")}
            >
              <LogOutIcon aria-hidden className="flip-rtl" />
              <span className="hidden sm:inline">{t("auth.logout")}</span>
            </Button>
          </form>
        </div>
      </header>
      {children}
    </CurrentUserProvider>
  )
}
