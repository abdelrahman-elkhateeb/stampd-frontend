import { getTranslations } from "next-intl/server"

import { LocaleSwitcher } from "@/components/locale-switcher"
import { Wordmark } from "@workspace/ui/components/wordmark"

export default async function AuthLayout({
  children,
}: LayoutProps<"/[locale]">) {
  const t = await getTranslations("app")

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="flex items-center justify-between gap-4 px-4 py-4 md:px-8">
        <Wordmark>{t("name")}</Wordmark>
        <LocaleSwitcher />
      </header>
      <main className="flex flex-1 items-start justify-center px-4 pt-4 pb-12 sm:items-center">
        {children}
      </main>
    </div>
  )
}
