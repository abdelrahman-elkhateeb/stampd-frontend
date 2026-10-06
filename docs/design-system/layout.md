# Layout, fonts & tenant branding

## Breakpoints
`xs 360 · sm 640 · md 768 · lg 1024 · xl 1280 · 2xl 1536` (`--breakpoint-xs: 22.5rem`; the others are Tailwind defaults). QA widths: 360 / 768 / 1280 (FE-15).

## Shells (`<AppShell variant="mobile" | "desktop">`)
Roles share shells: a Manager is the Employee shell plus a "My team" nav section; Admin/HR add "Company" (FE-03).

### Mobile shell (below `md`)
| Part | Spec |
|---|---|
| Top bar | 64px, `bg-background`, hairline bottom. Start: greeting or back arrow + title. End: bell (44×44). Sticky on lists and forms, not on dashboards |
| Content | `px-4 py-4`, `gap-4` between cards. Max column 480px (`max-w-[30rem] mx-auto`) from `sm` up |
| Hero | At most 1 hard-shadow card per screen. The Today card must be above the fold at 360×640 (FE-09) |
| Bottom nav | 72px + `env(safe-area-inset-bottom)`, max 4 items, labels always on. Employee: Home · Requests · Calendar · Me. Manager: Home · Requests · Approvals · Me |
| Form pages | Forms open full-page: back + title in the top bar, bottom nav hidden. Sticky action bar (72px + safe area) with a full-width primary |
| Sheets | Select, filters and pickers open as bottom sheets: `rounded-t-xl`, drag handle, `max-h-[85vh]` |
| Density | Always comfortable |
| Scroll | Only the content scrolls. No horizontal page scroll at 360. Tables scroll inside their own card |

### Desktop shell (`md` and up)
| Part | Spec |
|---|---|
| Sidebar | 240px, `--sidebar*` tokens, sections Me / My team / Company by role. A 64px rail with tooltips below `xl`. Butter (`--sidebar-primary`) on the active item only |
| Top bar | 64px. Start: breadcrumb + page title. End: global search (240px, `Ctrl K`), EN/عربي toggle, theme toggle, bell, avatar menu |
| Page padding | 32px at `lg+`, 24 at `md` |
| Page header | `h1` + one-line description at start. Max 1 primary action plus secondary actions at end. Wraps below `md` |
| Filters bar | Directly under the header or tabs. All filter state is in the URL (FE-14) |
| Grid | 12 columns, gutter 24 (`gap-6`) at `lg+`, 16 below. Content max-width 1440 |
| Density | HR/Admin routes set `data-density="compact"` on the layout root |
| Drawers | Inline-end, 440px default or 640px for timelines and the correction editor, over `--scrim` |

### Manager approvals split view (`lg+`)
Inbox list at inline-start (400px, scrolls independently) and the review panel filling the rest, with Approve/Reject pinned at its bottom. Below `lg` the list is full width, and the review opens as a drawer (`md`) or a page (mobile).

### Max widths
Page 1440 · forms 640 · reading text 720 · mobile column 480. Dashboards: 4 tiles per row at `xl`, 2 at `md`, 1 on mobile.

### Action placement
- Page primary action: in the page header, at inline-end.
- Form actions: at the bottom, primary at inline-end on desktop, sticky full-width on mobile.
- Row actions: last column.
- Destructive actions are never the default button.

## Fonts

| Family | Weights | Subset | Role |
|---|---|---|---|
| Plus Jakarta Sans | 400, 500, 600, 700, 800 | latin | UI (EN) |
| IBM Plex Sans Arabic | 400, 500, 600, 700 | arabic | UI (AR); `--fw-black` caps at 700 |
| IBM Plex Mono | 400, 500 | latin | Code, IDs in docs only |

All use `font-display: swap`. Preload only the 400 + 700 weights of the page language's family.

**Option A (preferred): next/font**
```ts
// app/fonts.ts
import { Plus_Jakarta_Sans, IBM_Plex_Sans_Arabic, IBM_Plex_Mono } from 'next/font/google';
export const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400','500','600','700','800'], display: 'swap', variable: '--font-jakarta', adjustFontFallback: true });
export const plexAr  = IBM_Plex_Sans_Arabic({ subsets: ['arabic'], weight: ['400','500','600','700'], display: 'swap', variable: '--font-plex-ar' });
export const plexMono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400','500'], display: 'swap', variable: '--font-plex-mono' });
// <html className={`${jakarta.variable} ${plexAr.variable} ${plexMono.variable}`}>
```
Then point the tokens at the variables:
`--font-ui: var(--font-jakarta), "Plus Jakarta Sans Fallback", ui-sans-serif, system-ui, sans-serif;` (and `var(--font-plex-ar)` under `:lang(ar)`, `var(--font-plex-mono)` for `--font-code`).

**Option B: @fontsource.** `npm i @fontsource/plus-jakarta-sans @fontsource/ibm-plex-sans-arabic @fontsource/ibm-plex-mono`, then import `fonts.css`. Its fallback faces are computed from @capsizecss/metrics, the same method as next/font:

| Fallback face | Local font | size-adjust | ascent | descent | line-gap |
|---|---|---|---|---|---|
| Plus Jakarta Sans Fallback | Arial | 104.98% | 98.88% | 21.15% | 0% |
| IBM Plex Sans Arabic Fallback | Tahoma | 100.73% | 107.72% | 41.20% | 0% |

Use A **or** B, never both.

## Tenant branding (FE-04)
A company can set a **logo** and one **accent colour** (`--tenant-accent`). Nothing else is themeable.

| Where | Logo size | Accent use |
|---|---|---|
| Sidebar header | 32×32 | 2px ring around the logo/initials (`0 0 0 2px var(--card), 0 0 0 4px var(--tenant-accent)`) |
| Mobile menu header | 24×24 | Ring |
| Top-bar avatar | — | Optional ring on the user avatar |
| Login · invite · reset screens | 48×48 | Ring; headline "Join {company}" |
| Email header | 32×32 | None (hex-only email styles) |
| CSV / reports | — | None; company name in the file name |

**Never** use the accent for buttons, links, the active nav item, focus rings, charts, status/category, backgrounds or illustrations.

**Logo:** PNG, SVG or JPG, ≤ 1 MB, square, ≥ 256×256. SVG is sanitised. Always rendered on a `--card` tile with a 1px `--border`, radius md, `object-fit: contain`, 4px padding. Fallback: up to 2 initials on `--inverse` / `--inverse-foreground`. `alt` = company name, or `alt=""` where the name is visible next to it.

**Accent validation** (client and server, on save and live in the picker):
```ts
const lightOk = contrast(accent, '#FFFDF9') >= 3;  // --card light
const darkOk  = contrast(accent, '#1F1C17') >= 3;  // --card dark
// Always accept (a colour cannot fail both: failing light needs luminance > 0.30, failing dark < 0.11).
// In each theme where !ok, render the ring with an extra 1px var(--border-strong) outline.
```
Only 6-digit hex is accepted. When an outline will be added, the picker says so: "Shown with an outline in dark mode so it stays visible." The default accent (butter) gets the outline in light mode, consistent with the butter rule.
