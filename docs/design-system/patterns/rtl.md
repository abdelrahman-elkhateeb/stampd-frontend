# Pattern · RTL & Arabic

Arabic is a first-class language: every component and screen is reviewed in RTL before merge.

## Setup
- `<html lang="ar" dir="rtl">` from the user's language. Wrap the app in Radix `<DirectionProvider dir={dir}>` so menus, tabs, sliders and popovers flip.
- `:lang(ar)` switches the font, type scale, tracking (0), case (`none`) and `--fw-black` (700). `[dir="rtl"]` sets `--flip: -1`.

## Rules
1. **Logical properties only:** `ms-/me-/ps-/pe-/start-/end-`, `border-s/e`, `rounded-s/e`, `text-start/end`, `inset-inline-*`. ESLint (`tailwindcss/no-physical-properties` or a custom regex rule) blocks `ml-`, `mr-`, `pl-`, `pr-`, `left-`, `right-`, `text-left`, `text-right`, `rounded-l/r`, `border-l/r`.
2. **Mirror:** layout order, navigation, back/next arrows, chevrons, log-in/out, plane, undo/redo, external-link, send (`flip-rtl` class), progress direction, sheet handles, drawer side and its side shadow, the switch thumb.
3. **Don't mirror:** clocks, check/x, search, media controls, logos, mascots, chart time axes, numbers, phone numbers, emails, IBANs, code. The hard shadow stays bottom-right (`4px 4px`), because light direction is physical.
4. **Mixed text:** wrap names, IDs, emails, times and Latin brand names inside Arabic sentences in `<bdi>`. Inputs for email, phone, IBAN, codes and URLs get `dir="ltr"` + `text-end`.
5. **Digits** follow the tenant setting through Intl. Never swap characters by hand. Inputs accept both systems and normalise to ASCII.
6. **Strings:** no concatenation. ICU MessageFormat with placeholders; Arabic plural forms included.
7. **Length:** allow ~25% more width for Arabic labels. Truncate with an ellipsis + tooltip, never clip. Buttons wrap only on mobile.
8. **Type:** Arabic has no letter-spacing, no uppercase, no italics. The overline style becomes a 600 label. The minimum Arabic size is 13px.
9. **Icons with direction meaning** in Arabic layouts (e.g. "next" chevron) point left. `flip-rtl` handles this automatically.
10. **Calendars and pickers:** the week starts per company settings. Grids mirror (Sunday on the right in RTL). Month navigation arrows mirror.

## QA checklist per screen
- [ ] Switch to Arabic: no physical spacing artefacts, nothing clipped at 360.
- [ ] Directional icons flipped; non-directional ones unchanged.
- [ ] Focus order follows the visual order (right to left).
- [ ] Mixed-direction strings render correctly (names, times, emails).
- [ ] Dates, times, numbers and plurals are correct with both digit settings.
- [ ] Screen reader reads Arabic with the Arabic voice (`lang` attributes are correct, including the `lang="ar"` toggle label on English pages).
