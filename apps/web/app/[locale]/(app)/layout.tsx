import { AppSidebar, BottomNav, TopBar } from "@/components/app-shell"
import { UserProvider } from "@/components/user-provider"
import { getMe } from "@/lib/api"

// proxy.ts has already sent signed-out visitors to login and roles to no-access.
export default async function AppLayout({
  children,
}: LayoutProps<"/[locale]">) {
  const user = await getMe()
  return (
    <UserProvider user={user}>
      <div className="flex min-h-svh bg-background">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar />
          {/* Mobile: a 480px column above the bottom nav. Desktop: page padding, 1440 max. */}
          <main className="mx-auto w-full flex-1 px-4 py-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] sm:max-w-[30rem] md:max-w-[90rem] md:p-6 lg:p-8">
            {children}
          </main>
        </div>
        <BottomNav />
      </div>
    </UserProvider>
  )
}
