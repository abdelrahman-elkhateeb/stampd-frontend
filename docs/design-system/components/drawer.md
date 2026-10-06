# Drawer (side sheet)

**Purpose.** Detail and edit views that keep the list in context: day detail (FE-06), request detail and timeline (FE-08), review panel below `lg` (FE-10), correction editor (FE-11), employee quick view (FE-05), Request Leave form on desktop (FE-07).

**Anatomy.** Scrim · panel from inline-end: header (avatar/icon + title `--fs-h4` + subtitle + close) · scrollable body · pinned footer with actions (equal-width buttons).

**Variants / sizes.** `default` 440 · `wide` 640 (timelines, correction editor with sessions and history). Full width below `sm` (it becomes a page on mobile for forms).

**Style.** `--card`, 1.5px `--border-strong` on the inline-start edge, side hard shadow `-6px 0 0` (flips to `6px 0 0` in RTL), header and footer hairlines.

**States.** Slide in from inline-end over `--dur-slower` with `ease-enter` (fade only under reduced motion). Saving: footer primary loading. Dirty + close → "Discard changes?" confirm.

**Behaviour.** The URL reflects the open drawer (`?request=7f3a`) so it can be deep-linked (FE-08 shareable links). Esc / close / scrim close it. Prev/next record navigation optional (`J`/`K`).

**Accessibility.** Radix Dialog (sheet), labelled by its title. Focus goes to the title (read views) or the first field (edit views), and returns to the row that opened it.

**RTL.** Opens from the left in RTL. The side shadow and border flip.

**Do / Don't.** ✅ Keep the table visible behind it on desktop. ❌ Nested drawers (use a modal or confirm for sub-steps).

**shadcn base + props.** `sheet.tsx` (side = logical end).
```ts
interface DrawerProps { open: boolean; onOpenChange: (o: boolean) => void; title: string; subtitle?: string; leading?: React.ReactNode; size?: 'default' | 'wide'; footer?: React.ReactNode; dirty?: boolean; urlKey?: string; children: React.ReactNode; }
```

**Tokens.** `--scrim`, `--card`, `--border-strong`, `--border`, `--elev-hard-lg` colour (side shadow), `--dur-slower`, `--motion-enter`.
