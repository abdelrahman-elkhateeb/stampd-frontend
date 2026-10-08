import { SettingsLayout } from "@/features/settings/settings-layout"

export default function Layout({
  children,
}: LayoutProps<"/[locale]/settings">) {
  return <SettingsLayout>{children}</SettingsLayout>
}
