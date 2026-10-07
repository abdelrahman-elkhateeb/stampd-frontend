"use client"

import { useTheme } from "next-themes"
import { useState } from "react"

import { LocaleSwitcher } from "@/components/locale-switcher"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group"

import { ControlsSection } from "./sections/controls"
import { FeedbackSection } from "./sections/feedback"
import { OverlaysSection } from "./sections/overlays"
import { StatusSection } from "./sections/status"
import { SurfacesSection } from "./sections/surfaces"
import { TableSection } from "./sections/table"

const SECTIONS = [
  { id: "controls", title: "Buttons and fields", Component: ControlsSection },
  {
    id: "status",
    title: "Statuses, badges and avatars",
    Component: StatusSection,
  },
  {
    id: "surfaces",
    title: "Cards, stat tiles and tabs",
    Component: SurfacesSection,
  },
  {
    id: "table",
    title: "Table, filters and pagination",
    Component: TableSection,
  },
  {
    id: "overlays",
    title: "Modal, drawer, confirm and toast",
    Component: OverlaysSection,
  },
  {
    id: "feedback",
    title: "Empty, loading and error states",
    Component: FeedbackSection,
  },
] as const

export function Gallery() {
  const { theme, setTheme } = useTheme()
  const [density, setDensity] = useState<"comfortable" | "compact">(
    "comfortable"
  )

  return (
    <div
      data-density={density === "compact" ? "compact" : undefined}
      className="min-h-svh bg-background"
    >
      <header className="sticky top-0 z-40 flex flex-wrap items-center gap-3 border-b bg-background/95 px-4 py-3 backdrop-blur">
        <h1 className="text-h4 font-bold">Component gallery</h1>
        <div className="ms-auto flex flex-wrap items-center gap-3">
          <ToggleGroup
            type="single"
            aria-label="Theme"
            value={theme ?? "system"}
            onValueChange={(value) => value && setTheme(value)}
            variant="outline"
            size="sm"
          >
            <ToggleGroupItem value="light">Light</ToggleGroupItem>
            <ToggleGroupItem value="dark">Dark</ToggleGroupItem>
            <ToggleGroupItem value="system">System</ToggleGroupItem>
          </ToggleGroup>
          <ToggleGroup
            type="single"
            aria-label="Density"
            value={density}
            onValueChange={(value) =>
              value && setDensity(value as typeof density)
            }
            variant="outline"
            size="sm"
          >
            <ToggleGroupItem value="comfortable">Comfortable</ToggleGroupItem>
            <ToggleGroupItem value="compact">Compact</ToggleGroupItem>
          </ToggleGroup>
          <LocaleSwitcher />
        </div>
      </header>

      <nav aria-label="Sections" className="border-b px-4 py-2">
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-body-sm">
          {SECTIONS.map((section) => (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                className="underline-offset-4 hover:underline"
              >
                {section.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <main className="mx-auto flex max-w-page flex-col gap-12 px-4 py-8">
        {SECTIONS.map(({ id, title, Component }) => (
          <section
            key={id}
            id={id}
            aria-labelledby={`${id}-title`}
            className="flex scroll-mt-28 flex-col gap-6"
          >
            <h2 id={`${id}-title`} className="text-h2 font-bold">
              {title}
            </h2>
            <Component />
          </section>
        ))}
      </main>
    </div>
  )
}
