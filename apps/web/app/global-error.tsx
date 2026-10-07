"use client"

import { usePathname } from "next/navigation"

import "@workspace/ui/globals.css"
import { fontVariables } from "@/lib/fonts"
import ar from "@/messages/ar.json"
import en from "@/messages/en.json"
import { cn } from "@workspace/ui/lib/utils"
import { Button } from "@workspace/ui/components/button"
import { ErrorState } from "@workspace/ui/components/error-state"

// Replaces the root layout when it crashes, so there is no i18n provider or theme here.
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  const isArabic = usePathname()?.startsWith("/ar") ?? false
  const t = (isArabic ? ar : en).errors

  return (
    <html
      lang={isArabic ? "ar" : "en"}
      dir={isArabic ? "rtl" : "ltr"}
      className={cn("antialiased", ...fontVariables)}
    >
      <body>
        <title>{t.crash.title}</title>
        <main className="flex min-h-svh items-center">
          <ErrorState
            variant="page"
            status={500}
            title={t.crash.title}
            body={t.crash.body}
            code={error.digest}
            codeLabels={{
              label: t.supportCode,
              copy: t.copySupportCode,
              copied: t.copied,
            }}
            actions={
              <>
                <Button onClick={retry}>{t.tryAgain}</Button>
                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}
                >
                  {t.reload}
                </Button>
              </>
            }
          />
        </main>
      </body>
    </html>
  )
}
