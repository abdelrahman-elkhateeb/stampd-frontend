# Empty state

**Purpose.** Explain why a list or section is empty and what to do next. Copy: `content.md`. Decisions: `patterns/empty-loading-error.md`.

**Anatomy.** Visual (doodle 120×96, or a 56px icon circle) · title (`--fs-h3` 700) · body (`--fs-body`, max 280px wide) · optional action.

**Variants**
| variant | Visual | Action |
|---|---|---|
| `first-use` | Doodle (sparkle + subject in a category tint, 2px ink line, `--illo-*` colours) | Brand hero button (e.g. "New request") |
| `caught-up` | Sparkle doodle | Link ("See decided requests") |
| `filtered` | `Search` icon in a `--muted` circle, **no doodle** | "Clear filters" (outline) |
| `no-data` | Icon circle | Optional link |
| `compact` | No visual, title + body inline (cards, dropdowns) | Optional link |

**Sizes.** Padding `--space-10` / `--space-6` in cards, `--space-16` on full pages. Centred.

**Behaviour.** Doodles appear only in `first-use` and `caught-up`, and the doodle is the same in both themes. They never appear in tables inside HR screens beyond one per page.

**Accessibility.** Doodles are `aria-hidden`. The title is a heading at the correct level for its position.

**RTL.** Centred; the doodle is not mirrored.

**Do / Don't.** ✅ Say what lives here and how to fill it. ❌ "No data". ❌ Doodles on error or filtered states.

**shadcn base + props.** Custom.
```ts
interface EmptyStateProps { variant: 'first-use' | 'caught-up' | 'filtered' | 'no-data' | 'compact'; title: string; body?: string; action?: React.ReactNode; doodle?: 'sparkle' | 'calendar' | 'inbox'; headingLevel?: 2 | 3 | 4; }
```

**Tokens.** `--illo-ink`, `--illo-yellow`, `--illo-paper`, `--cat-*` (doodle subject), `--muted`, `--subtle-foreground`, `--brand*`.
