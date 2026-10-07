"use client"

import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { ArrowLeftIcon } from "lucide-react"

import { Link } from "@/i18n/navigation"
import { Button } from "@workspace/ui/components/button"
import { ErrorState } from "@workspace/ui/components/error-state"

type Kind = "notFound" | "forbidden" | "crash"

const STATUS = { notFound: 404, forbidden: 403, crash: 500 } as const

export function ErrorPage({
  kind,
  code,
  onRetry,
}: {
  kind: Kind
  code?: string
  onRetry?: () => void
}) {
  const t = useTranslations("errors")
  const router = useRouter()

  return (
    <main className="flex min-h-svh items-center">
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
    </main>
  )
}
