import { ErrorPage } from "@/components/error-page"

// proxy.ts rewrites routes the role can't open to here, keeping the URL.
export default function NoAccessPage() {
  return <ErrorPage kind="forbidden" inShell />
}
