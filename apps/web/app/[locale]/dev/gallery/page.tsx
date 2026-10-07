import type { Metadata } from "next"
import { setRequestLocale } from "next-intl/server"
import { Suspense } from "react"

import type { Locale } from "@/i18n/routing"

import { Gallery } from "./gallery"

export const metadata: Metadata = {
  title: "Component gallery",
  robots: { index: false },
}

// Dev-only (FE-01c): every shared component in its states, in both themes and languages.
// Section titles are English only; component copy comes from the message catalogs.
export default async function GalleryPage({
  params,
}: PageProps<"/[locale]/dev/gallery">) {
  setRequestLocale((await params).locale as Locale)

  return (
    // The table keeps its state in the URL (nuqs), which needs a Suspense boundary.
    <Suspense>
      <Gallery />
    </Suspense>
  )
}
