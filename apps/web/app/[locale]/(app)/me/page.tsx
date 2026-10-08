import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"

import { ProfilePage } from "@/features/profile/profile-page"
import type { Locale } from "@/i18n/routing"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("profile")
  return { title: t("title") }
}

export default async function MePage({ params }: PageProps<"/[locale]/me">) {
  setRequestLocale((await params).locale as Locale)
  return <ProfilePage />
}
