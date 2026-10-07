import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { setRequestLocale } from "next-intl/server"
import { Suspense } from "react"

import type { CurrentUser } from "@/api/generated/model"
import { CurrentUserProvider } from "@/components/current-user-provider"
import type { Locale } from "@/i18n/routing"
import { devRoutesEnabled } from "@/lib/auth/routes"

import { Gallery } from "./gallery"

export const metadata: Metadata = {
  title: "Component gallery",
  robots: { index: false },
}

// The gallery needs no login; components that read the company (timezone, week start)
// get this demo user instead.
const DEMO_USER: CurrentUser = {
  id: "00000000-0000-4000-8000-000000000001",
  name: "Sara Al-Harbi",
  email: "sara@demo.stampd.app",
  role: "ADMIN",
  locale: "en",
  company: {
    id: "00000000-0000-4000-8000-000000000002",
    name: "Demo Trading Co.",
    timezone: "Asia/Riyadh",
    weekStart: "SUN",
  },
}

// Dev-only (FE-01c): every shared component in its states, in both themes and languages.
// Section titles are English only; component copy comes from the message catalogs.
export default async function GalleryPage({
  params,
}: PageProps<"/[locale]/dev/gallery">) {
  if (!devRoutesEnabled()) notFound()
  setRequestLocale((await params).locale as Locale)

  return (
    <CurrentUserProvider user={DEMO_USER}>
      {/* The table keeps its state in the URL (nuqs), which needs a Suspense boundary. */}
      <Suspense>
        <Gallery />
      </Suspense>
    </CurrentUserProvider>
  )
}
