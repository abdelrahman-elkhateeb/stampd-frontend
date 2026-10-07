import type { ClassValue } from "cn"
import { createCn } from "cn/config"

/**
 * Class merging that knows the Stampd theme (globals.css @theme).
 * Without this, custom font sizes like `text-ui` look like text colours to the merger,
 * and `cn("text-primary-foreground", "text-ui")` silently drops the colour.
 */
export const cn: (...inputs: ClassValue[]) => string = createCn({
  extend: {
    theme: {
      text: [
        "hero",
        "display",
        "h1",
        "h2",
        "h3",
        "h4",
        "body-lg",
        "body",
        "body-sm",
        "caption",
        "numeric",
        "ui",
        "cell",
      ],
      spacing: [
        "control",
        "control-sm",
        "control-xs",
        "chip",
        "chip-sm",
        "row",
        "cell",
        "card",
        "icon",
      ],
      radius: ["pill"],
      shadow: ["hard-sm", "hard", "hard-lg", "pop"],
    },
  },
})
