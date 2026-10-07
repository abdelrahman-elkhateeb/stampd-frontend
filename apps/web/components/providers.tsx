"use client"

import { QueryClientProvider } from "@tanstack/react-query"
import { NuqsAdapter } from "nuqs/adapters/next/app"
import { useTranslations } from "next-intl"
import { useEffect, useState } from "react"

import { ThemeProvider } from "@/components/theme-provider"
import { useRouter } from "@/i18n/navigation"
import { makeQueryClient, setApiErrorHandlers } from "@/lib/query-client"
import { DirectionProvider } from "@workspace/ui/components/direction"
import { notify, Toaster } from "@workspace/ui/components/sonner"
import { TooltipProvider } from "@workspace/ui/components/tooltip"

export function Providers({
  dir,
  children,
}: {
  dir: "ltr" | "rtl"
  children: React.ReactNode
}) {
  const t = useTranslations("apiErrors")
  const router = useRouter()
  // One client per browser session (and per request on the server).
  const [queryClient] = useState(makeQueryClient)

  useEffect(() => {
    setApiErrorHandlers({
      onUnauthenticated: () => {
        const returnTo = window.location.pathname + window.location.search
        queryClient.clear()
        router.replace({
          pathname: "/login",
          query: { returnTo, reason: "expired" },
        })
      },
      onMutationError: (code) => {
        notify.error(t.has(code) ? t(code) : t("UNKNOWN"))
      },
    })
  }, [queryClient, router, t])

  return (
    <NuqsAdapter>
      <QueryClientProvider client={queryClient}>
        <DirectionProvider dir={dir}>
          <ThemeProvider>
            <TooltipProvider>
              {children}
              <Toaster
                position={dir === "rtl" ? "bottom-left" : "bottom-right"}
                dir={dir}
              />
            </TooltipProvider>
          </ThemeProvider>
        </DirectionProvider>
      </QueryClientProvider>
    </NuqsAdapter>
  )
}
