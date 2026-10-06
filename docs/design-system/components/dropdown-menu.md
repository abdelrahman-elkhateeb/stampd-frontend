# Dropdown menu (incl. user menu & row actions) · v0.4

**Purpose.** Short lists of actions or options behind a trigger: the user menu (FE-03), table row actions, "More actions" buttons.

**Anatomy.** Popover (`--popover`, 1px `--border`, `--elev-pop`, radius md, padding 6, min-width 220) · optional header (user menu: avatar 36 + name + email) · groups separated by 1px `--border` lines · items (36px, radius sm: 16px icon + label + optional meta or shortcut at end) · destructive group last.

**Item types.** action · link · checkbox item · radio item (Language: English / العربية; Theme: System / Light / Dark, with a check on the selected one) · submenu (chevron, `flip-rtl`) · destructive (`--destructive` text, e.g. Log out, Mark absent, Remove).

**User menu contents (FE-03).** Profile · Email preferences · Language › · Theme › · Keyboard shortcuts (`?`) · Log out.

**States.** highlighted (`--accent`) · disabled (`--disabled-foreground` + reason as meta) · focus = highlighted.

**Behaviour.** Opens on click, Enter, Space or ↓. Keys: ↑↓ move, → opens a submenu (← in RTL), Enter selects, Esc closes and returns focus, typeahead jumps. Selecting an action closes the menu, except checkbox and radio items. Destructive items open the confirm pattern; they never act directly. Aligned to the trigger's inline-end edge, below; flips when there's no room.

**Accessibility.** Radix DropdownMenu: `menu` / `menuitem` / `menuitemradio` / `menuitemcheckbox`, `aria-expanded` on the trigger. Triggers have specific names ("Actions for Sara", "Account menu").

**RTL.** The menu mirrors and submenus open to the left.

**Props.**
```ts
type MenuEntry = { type: 'item'; label: string; icon?: LucideIcon; onSelect: () => void; shortcut?: string; destructive?: boolean; disabled?: string }
  | { type: 'radio'; label: string; value: string; options: { value: string; label: string }[]; onChange: (v: string) => void }
  | { type: 'separator' } | { type: 'sub'; label: string; icon?: LucideIcon; items: MenuEntry[] };
interface DropdownProps { trigger: React.ReactElement; header?: React.ReactNode; items: MenuEntry[]; align?: 'start' | 'end'; }
```

**Tokens.** `--popover`, `--border`, `--elev-pop`, `--accent`, `--destructive`, `--disabled-foreground`, `--muted-foreground`, `--radius-md`, `--radius-sm`.
