import { ErrorPage } from "@/components/error-page"

// Rendered with a 403 status when a server component or action calls forbidden().
export default function Forbidden() {
  return <ErrorPage kind="forbidden" />
}
