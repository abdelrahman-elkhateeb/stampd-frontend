import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"

import { AuthCard } from "@/features/auth/auth-card"
import { findInvite } from "@/features/auth/auth-api"
import { InviteForm } from "@/features/auth/invite-form"
import type { Locale } from "@/i18n/routing"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.invite")
  return { title: t("metaTitle") }
}

export default async function InvitePage({
  params,
}: PageProps<"/[locale]/invite/[token]">) {
  const { locale, token } = await params
  setRequestLocale(locale as Locale)
  const t = await getTranslations("auth.invite")
  const invite = await findInvite(token)

  // An expired invite shows the explanation only, no form (FE-02 AC).
  if (!invite) {
    return <AuthCard title={t("expiredTitle")} description={t("expiredBody")} />
  }

  return (
    <AuthCard
      company={invite.companyName}
      title={t("title", { company: invite.companyName })}
      description={t("description")}
    >
      <InviteForm token={token} name={invite.name} email={invite.email} />
    </AuthCard>
  )
}
