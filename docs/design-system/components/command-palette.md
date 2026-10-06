# Command palette (global search) · v0.4

**Purpose.** Jump to people, requests, pages or actions from anywhere (FE-03 top bar search).

**Anatomy.** Dialog 560 wide (full screen on mobile), hero frame (1.5px `--border-strong`, `--elev-hard-lg`, radius xl) · search row (52px: search icon, input, `Esc` kbd) · results grouped under overline labels: **People** (avatar 24, name with the matched part bold, department) · **Requests** (category swatch, "{name} · {type} · {dates}", status word) · **Pages** (nav icon, page name) · **Actions** ("Request leave", "New request", "Export attendance CSV") · footer hints (↑↓ navigate · ↵ open · Esc close).

**Behaviour.**
- Opens with `Ctrl/⌘ K`, `/` (when not typing in a field), or by clicking the top-bar search.
- Pages and actions filter locally. People and requests are searched on the server, debounced 200 ms, max 5 per group, **scoped by role on the server**: employees get pages, actions and their own requests; managers add direct reports; HR gets everyone.
- Empty query: recent items + suggested actions.
- No results: "No results for '{q}'".
- Enter opens the item and closes the palette. Recent items are stored per user on the device.

**States.** loading (12px spinner in the search row; previous results stay) · error (inline "Search is unavailable. Try again." with Retry).

**Accessibility.** cmdk: `combobox` + `listbox` with `aria-activedescendant`. Group labels are `group` with `aria-label`. The result count is announced politely.

**RTL.** Mirrors. Latin names and IDs are wrapped in `<bdi>`.

**Props.**
```ts
interface CommandPaletteProps { open: boolean; onOpenChange: (o: boolean) => void; role: 'employee' | 'manager' | 'admin'; search: (q: string, signal: AbortSignal) => Promise<{ people: PersonHit[]; requests: RequestHit[] }>; pages: { label: string; href: string; icon: LucideIcon }[]; actions: { label: string; onRun: () => void; icon: LucideIcon }[]; }
```

**Tokens.** `--card`, `--border-strong`, `--elev-hard-lg`, `--radius-xl`, `--border`, `--accent`, `--muted-foreground`, `--cat-*`, `--status-*`.
