import { notFound } from "next/navigation"

// Any unknown path under /en or /ar renders the localised not-found page.
export default function CatchAllPage() {
  notFound()
}
