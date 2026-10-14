import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"

import { getProfile } from "@/features/profile/profile-data"
import { ProfilePage } from "@/features/profile/profile-page"
import type { Locale } from "@/i18n/routing"
import { getMe } from "@/lib/api"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("profile")
  return { title: t("title") }
}

export default async function MePage({ params }: PageProps<"/[locale]/me">) {
  setRequestLocale((await params).locale as Locale)
  const me = await getMe()
  return <ProfilePage profile={await getProfile(me.id)} />
}
