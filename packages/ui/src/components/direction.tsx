"use client"

import { Direction } from "radix-ui"

// Radix menus, tabs, sliders and popovers read the direction from this context
// (docs/design-system/patterns/rtl.md).
function DirectionProvider({
  dir,
  children,
}: {
  dir: "ltr" | "rtl"
  children: React.ReactNode
}) {
  return <Direction.Provider dir={dir}>{children}</Direction.Provider>
}

export { DirectionProvider }
