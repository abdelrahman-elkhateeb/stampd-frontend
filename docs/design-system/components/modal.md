# Modal (dialog)

**Purpose.** Focused, short tasks that block the page: request type picker, add holiday, invite employee, small forms. For long forms or detail with context, use Drawer; on mobile, forms are pages.

**Anatomy.** Scrim (`--scrim`) · dialog: header (title `--fs-h3` 700 + optional description `--muted-foreground` + close icon button at inline-end) · scrollable body (`gap-4`) · footer (hairline top; secondary + primary at inline-end).

**Variants / sizes.** `sm` 400 (simple choices) · `md` 560 (forms, default) · `lg` 720 (complex, e.g. CSV import preview). Max height `calc(100dvh - 64px)`; header and footer pinned, body scrolls.

**Style.** `--card`, 1.5px `--border-strong`, `--radius-xl`, `--elev-hard-lg`. Padding: header 24/24/8, body 16/24, footer 16/24/24.

**States.** Opening: fade + 8px rise over `--dur-slow` with `ease-enter`; closing over `--dur-base` with `ease-exit` (opacity only with reduced motion). Submitting: primary loading, other controls disabled. Error: section alert in the body, the dialog stays open.

**Behaviour.** Esc, the close button and a scrim click close it, unless there are unsaved changes (then the "Discard changes?" confirm). Below `sm` every modal renders as a bottom sheet (`Drawer` from vaul, `rounded-t-xl`, drag handle). Never stack two modals; open a confirm only on top of a modal for destructive steps.

**Accessibility.** Radix Dialog: `aria-modal`, `aria-labelledby` title, `aria-describedby` description, focus trapped, initial focus on the first field (or the title if there's no field), focus returned to the trigger on close. The close button is labelled "Close".

**RTL.** The close button sits at the top-left in RTL. The footer order mirrors.

**Do / Don't.** ✅ One task per modal. ❌ Modals for long forms on mobile. ❌ Destructive actions without the confirm pattern.

**shadcn base + props.** `dialog.tsx` + `drawer.tsx` (mobile).
```ts
interface ModalProps { open: boolean; onOpenChange: (o: boolean) => void; title: string; description?: string; size?: 'sm' | 'md' | 'lg'; footer?: React.ReactNode; dirty?: boolean; children: React.ReactNode; }
```

**Tokens.** `--scrim`, `--card`, `--border-strong`, `--elev-hard-lg`, `--radius-xl`, `--border`, `--muted-foreground`, `--dur-slow`, `--dur-base`, `--motion-enter`, `--motion-exit`.
