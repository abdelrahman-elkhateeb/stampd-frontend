# Live request preview (composite) · v0.4

**Purpose.** Show the server-computed consequences of a request while it is being filled (FE-07), so validation happens before Submit.

**Anatomy (valid).** Headline: "{n} working days" + date range · balance row: "{type} balance {before} → {after}" (the after value is a `--cat-leave` chip with an ink outline) · "Not counted" list (holidays by name; weekends implied) · conflicts note (`--warning`, "Omar is also off on 12 Oct"; employees see "2 teammates off" without names).

**Anatomy (invalid).** Error card (`--error-bg` / `--error`): title from the content formula ("You have 2 days available") + one-line fix ("This request needs 3. Shorten the dates or pick another leave type.").

**Behaviour.**
- Calls `POST /requests/preview` 300 ms after the last change to type, dates, half-day or time. In-flight requests are cancelled (AbortController).
- While loading, the previous content stays at 50% opacity with a 16px spinner at the top (no layout jump).
- Submit is disabled while the preview is invalid or loading, with `aria-describedby` pointing to the preview.
- Covers FE-07 errors: insufficient balance, overlap with existing requests, no working days, date limits, and leave spanning two leave years ("Split this request at 31 Dec", shown verbatim from the API).

**Placement.** Desktop drawer: under the date fields, sticky above the footer. Mobile page: in the flow, above the sticky action bar.

**Accessibility.** `aria-live="polite"` on the headline only, so one sentence is announced per change. The error card has `role="alert"` when it first appears.

**RTL.** The balance arrow flips.

**Props.**
```ts
interface RequestPreviewProps { state: 'idle' | 'loading' | 'valid' | 'invalid'; workingDays?: number; range?: { from: string; to: string }; balance?: { typeName: string; before: number; after: number }; excluded?: { date: string; reason: string }[]; conflicts?: { names?: string[]; count: number; date: string }[]; error?: { title: string; body: string }; }
```

**Tokens.** `--card`, `--border`, `--cat-leave`, `--border-strong`, `--warning`, `--error`, `--error-bg`, `--muted-foreground`.
