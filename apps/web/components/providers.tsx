"use client"

import { NuqsAdapter } from "nuqs/adapters/next/app"
import { ThemeProvider } from "next-themes"

import { DirectionProvider } from "@workspace/ui/components/direction"
import { Toaster } from "@workspace/ui/components/sonner"
import { TooltipProvider } from "@workspace/ui/components/tooltip"

export function Providers({
  dir,
  children,
}: {
  dir: "ltr" | "rtl"
  children: React.ReactNode
}) {
  return (
    <NuqsAdapter>
      <DirectionProvider dir={dir}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider>
            {children}
            <Toaster
              position={dir === "rtl" ? "bottom-left" : "bottom-right"}
              dir={dir}
            />
          </TooltipProvider>
        </ThemeProvider>
      </DirectionProvider>
    </NuqsAdapter>
  )
}
