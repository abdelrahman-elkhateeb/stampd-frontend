"use client"

import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { ArrowLeftIcon } from "lucide-react"

import { Link } from "@/i18n/navigation"
import { Button } from "@workspace/ui/components/button"
import { ErrorState } from "@workspace/ui/components/error-state"

const STATUS = { forbidden: 403, notFound: 404, crash: 500 } as const

export function ErrorPage({
  kind,
  code,
  onRetry,
  inShell,
}: {
  kind: keyof typeof STATUS
  code?: string
  onRetry?: () => void
  /** Rendered inside the app shell, which already has the <main>. */
  inShell?: boolean
}) {
  const t = useTranslations("errors")
  const router = useRouter()
  const Root = inShell ? "div" : "main"

  return (
    <Root className={inShell ? "py-8 md:py-16" : "flex min-h-svh items-center"}>
      <ErrorState
        variant="page"
        status={STATUS[kind]}
        title={t(`${kind}.title`)}
        body={t(`${kind}.body`)}
        code={code}
        codeLabels={{
          label: t("supportCode"),
          copy: t("copySupportCode"),
          copied: t("copied"),
        }}
        actions={
          <>
            {onRetry ? (
              <Button onClick={onRetry}>{t("tryAgain")}</Button>
            ) : (
              <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeftIcon aria-hidden className="flip-rtl" />
                {t("goBack")}
              </Button>
            )}
            <Button variant={onRetry ? "outline" : "default"} asChild>
              <Link href="/">{t("goHome")}</Link>
            </Button>
          </>
        }
      />
    </Root>
  )
}
