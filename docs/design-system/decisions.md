# Decisions log

All decisions are locked unless marked **Open**. ⚑ = conflicts with a Trello ticket and needs the ticket (or this decision) updated. Dates are in Asia/Riyadh.

| # | Decision | Rationale | Date |
|---|---|---|---|
| 1 | Product name **Stampd** (Latin) | Echoes بصمة (clock-in stamp), short, brandable | 2026-10-06 |
| 2 | **Open:** Arabic wordmark. Options: بصمة / ستامبد / بصمتك. "WORDMARK PLACEHOLDER" until chosen | Needs trademark (SAIP, UAE, GCC; classes 9, 42) and domain checks first. Recommendation: بصمة | 2026-10-06 |
| 3 | Look: "bold on heroes". Ink outline + hard shadow only on hero moments; HR screens near-flat | Keeps character without making data screens shouty | 2026-10-06 |
| 4 | Tenant customisation = logo + one accent (rings only) | Status/category meaning must be identical across companies | 2026-10-06 |
| 5 | Two colour families: saturated **status** (icon + label) vs pastel **category** (ink outline) | Status = what happened, category = what kind | 2026-10-06 |
| 6 | **Light + dark both ship in MVP and are QA'd.** ⚑ FE-01 says "light theme" | User decision, 6 Oct. Tokens are literal per theme, so `.dark` is cheap to maintain | 2026-10-06 |
| 7 | Type: Plus Jakarta Sans (EN) + IBM Plex Sans Arabic (AR) + IBM Plex Mono (code). Arabic one step larger, no tracking or caps, max weight 700 | Matching x-height and weight. Arabic needs the extra size to read at the same visual weight | 2026-10-06 |
| 8 | Arabic/RTL equal priority from day 1. Western digits by default, Eastern digits per tenant. Hijri as an optional second line | GCC market expectations; no retrofitting later | 2026-10-06 |
| 9 | Density: comfortable (48px controls) for employees, compact (36px) for HR via `data-density`. 44px touch floor | One token set, two contexts | 2026-10-06 |
| 10 | Icons: lucide-react, 1.75 stroke at 20px. Directional icons flip in RTL | Ships with shadcn; stroke matches the borders | 2026-10-06 |
| 11 | Doodles only in "caught up" and first-use empty states. Mascots in marketing only | Delight without noise in daily use | 2026-10-06 |
| 12 | Motion: quick and tactile, 120–280ms. Press = translate into shadow. Honour reduced motion | Feels physical, never slows work | 2026-10-06 |
| 13 | Stack: Tailwind v4 `@theme inline` + shadcn variable names + Stampd extras | Drop-in with shadcn; utilities follow runtime vars | 2026-10-06 |
| 14 | Default week Sun–Thu (Fri–Sat weekend), tenant-configurable. ⚑ FE-04 says new companies default to Mon–Fri | GCC norm. Keep one default in both places, ideally Sun–Thu for GCC sign-ups | 2026-10-06 |
| 15 | Timestamps stored in UTC and shown in the company timezone (default Asia/Riyadh). Calendar days are plain dates | Matches BE-01 conventions; avoids off-by-one days | 2026-10-06 |
| 16 | Brand butter `--brand` is separate from shadcn `--accent` (hover) | Otherwise every hover turns yellow | 2026-10-06 |
| 17 | Late = `#B8400A` (orange), split from the yellow-brown Pending and Missing checkout | Hue separation for typical vision (ΔE ≥ 18) | 2026-10-06 |
| 18 | Calendar bars: Late solid · Missing checkout long-dash 8/4 · Pending dot 3/3, plus a 12px icon | Under greyscale and colour-blindness simulation the three collapse to ΔE ≤ 4.2; shape must carry it | 2026-10-06 |
| 19 | Category pair rule: a request-type colour stays ≥ ΔE 11 from every status shown beside it and ≥ 13 from other categories | A strict "no shared hue family" rule is impossible: the 12 statuses use every hue | 2026-10-06 |
| 20 | Request types: Leave `#FFD3B0` · WFH `#EBC7F0` · Trip `#C7D3FA` · Permission `#DDEFAE` · Correction `#C2E5F2`. Mint, coral and yellow retired (now avatar colours) | They sat next to Approved, Rejected and Pending on every request | 2026-10-06 |
| 21 | All leave types share `--cat-leave` and differ by **icon** + name. ⚑ FE-04 asks for a colour per leave type; propose an icon picker | No free hue passes the pair rule | 2026-10-06 |
| 22 | Added statuses: Withdrawn, Cancellation requested (dashed), Not yet checked in, Out | Required by FE-07/08/10/12/13/15 status lists | 2026-10-06 |
| 23 | Chart palette `--chart-1…5` (slot 5 = neutral stone) plus trend aliases. No donuts or pies; a table fallback is mandatory | Olive collapsed into orange under protanopia (ΔE 2.0) | 2026-10-06 |
| 24 | shadcn sidebar tokens added. Butter `--sidebar-primary` for the active item only | Matches the navigation spec | 2026-10-06 |
| 25 | Fonts: `next/font` preferred; `@fontsource` + computed fallback faces as option B | Zero layout shift; self-hosted | 2026-10-06 |
| 26 | Marketing expression (caps headline, mascots, 3 butters above the fold) is allowed only outside the app and is labelled as such | Prevents devs copying landing-page styling into product UI | 2026-10-06 |
| 27 | No location prompts anywhere (the location switch was removed from the design) | FE-06 business rule | 2026-10-06 |
| 28 | Arabic buttons use the verbal noun (مصدر), e.g. "تسجيل الحضور" | Gender-neutral, standard in Arabic UI | 2026-10-06 |
| 29 | Durations use a custom formatter, "7h 45m" / "7س 45د", not Intl.DurationFormat | ICU output «7 س و45 د» is too long for cells | 2026-10-06 |
| 30 | Tenant accent always accepted. In a theme where it is below 3:1 against the card, the ring gets an automatic 1px `--border-strong` outline | No colour can fail both themes, so there is never a reason to reject | 2026-10-06 |
| 31 | The current clock action (Check in or Check out) is the Today card's brand hero button. After checkout, the card drops to level 1 | One primary action at a time (FE-06); butter = "do this now" | 2026-10-07 |
| 32 | Balance bar order and patterns are fixed: used (solid ink) → upcoming (ink hatch) → pending (amber stripes) → available (leave fill) | Readable without colour; matches the ledger entry types | 2026-10-07 |
| 33 | Leave-type icons are unique per company, from a closed set of 12 | Icons are the only differentiator between leave types | 2026-10-07 |
| 34 | **Open:** tenant setting `showCorrectorName`, i.e. whether employees see the HR person's name in correction history | Privacy preference varies by company | 2026-10-07 |
