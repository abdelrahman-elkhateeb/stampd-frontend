# Tabs

**Purpose.** Switch between sibling content sets on one page: Pending / Decided (FE-10), Attendance / Leave / WFH (FE-14), Daily log / Corrections / Exceptions (FE-11), Unread / All (notifications).

**Anatomy.** Tablist on a hairline bottom border · tabs (label + optional count badge) · tabpanels.

**Variants.** `page` (underline) · `segmented` → use Segmented control instead.

**Sizes / density.** Tab height 44, padding-inline `--space-3`, text `--fs-body` 600. Scrolls horizontally on mobile with an edge fade.

**States**
| State | Style |
|---|---|
| default | `--subtle-foreground`, 600 |
| hover | `--accent` background, top corners radius sm |
| selected | `--foreground` 700 + 2.5px inset bottom bar `--foreground` |
| focus-visible | 2px `--ring` inset |
| disabled | `--disabled-foreground`, reason in the tooltip |

**Counts.** `count` badge (neutral) by default; `count-attention` (pending tint) when the items need action.

**Behaviour.** Automatic activation (arrow keys switch). The tab state is in the URL (`?tab=decided`). Panels keep their scroll position when you return to them.

**Accessibility.** Radix Tabs (`tablist`/`tab`/`tabpanel`, `aria-controls`, roving tabindex, Home/End). The tab name includes the count ("Corrections, 5").

**RTL.** The order mirrors and the arrow keys follow direction.

**Do / Don't.** ✅ 2–5 tabs. ❌ Tabs for steps or filters.

**shadcn base + props.** `tabs.tsx`.
```ts
interface PageTabsProps<T extends string> { value: T; onValueChange: (v: T) => void; tabs: { value: T; label: string; count?: number; attention?: boolean; disabled?: boolean }[]; }
```

**Tokens.** `--foreground`, `--subtle-foreground`, `--accent`, `--border`, `--ring`, `--disabled-foreground`, `--inverse*`, `--status-pending*`.
