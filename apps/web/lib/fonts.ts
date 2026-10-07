import {
  IBM_Plex_Mono,
  IBM_Plex_Sans_Arabic,
  Plus_Jakarta_Sans,
} from "next/font/google"

// Font variables are read by --font-ui / --font-code in packages/ui/src/styles/tokens.css.
// :lang(ar) switches --font-ui to Plex Arabic, so both families load on every page.
const fontLatin = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
})

const fontArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex-arabic",
})

const fontMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
})

export const fontVariables = [
  fontLatin.variable,
  fontArabic.variable,
  fontMono.variable,
]
