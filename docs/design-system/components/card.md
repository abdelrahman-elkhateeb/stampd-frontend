# Card

**Purpose.** Group related content: dashboard widgets, request summaries, balance cards, settings sections.

**Anatomy.** Container · optional header (title `--fs-h4` 700, optional description, optional action at inline-end) · body · optional footer (actions or link).

**Variants (elevation level)**
| variant | Style | Use |
|---|---|---|
| `default` (level 1) | `--card`, 1px `--border`, `--radius-lg`, padding `p-card` | Almost everything |
| `interactive` | default + hover: 1px `--border-strong` + `--elev-hard-sm` | Whole card links ("Leave requests →") |
| `selected` | `--brand-subtle`, 2px `--border-strong` | Choice cards (day part, request type picker) |
| `hero` (level 2) | `--card`, 1.5px `--border-strong`, `--elev-hard` | Today/check-in card, mobile approval card, first-use. **Max 1 per screen** |
| `sunken` | `--muted`, no border | Inner blocks (request details inside a card) |

**Sizes / density.** Padding `p-card` (20 comfortable / 16 compact). Header → body gap `--space-4`. Radius `--radius-lg` (12).

**States.** Interactive: hover (above), focus-visible (2px `--ring` around the card), pressed (`translate(1px,1px)`, shadow removed). Loading: the body becomes skeleton blocks with the same dimensions.

**Behaviour.** An interactive card is one link or button. It must not contain other interactive elements (move them out or make the card non-interactive). Cards in a grid stretch to equal height per row.

**Accessibility.** Use a `<section aria-labelledby>` (or `<article>` for request cards). The interactive card's accessible name is its title. Hard-shadow decoration has no semantic meaning.

**RTL.** The header action moves to the left in RTL. The shadow stays bottom-right.

**Do / Don't.** ✅ One idea per card. ❌ Nesting cards inside cards (use `sunken`). ❌ Two hero cards on one screen.

**shadcn base + props.** `card.tsx`.
```ts
interface StampdCardProps extends React.HTMLAttributes<HTMLElement> { variant?: 'default' | 'interactive' | 'selected' | 'hero' | 'sunken'; title?: string; description?: string; action?: React.ReactNode; href?: string; as?: 'section' | 'article' | 'div'; loading?: boolean; }
```

**Tokens.** `--card`, `--border`, `--border-strong`, `--brand-subtle`, `--muted`, `--elev-hard`, `--elev-hard-sm`, `--card-p`, `--radius-lg`, `--ring`.
