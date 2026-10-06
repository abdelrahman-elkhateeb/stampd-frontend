# Confirm dialog

**Purpose.** Confirm a destructive or irreversible action. Full rules: `patterns/destructive-confirm.md`.

**Anatomy.** Scrim · 400px alertdialog: optional 44px icon circle (`--error-bg` / `--error`) · title (question with the specific object, `--fs-h4` 700) · description (consequence) · optional required input · optional impact list · buttons (safe outline + destructive).

**Variants.** `destructive` (default: reject, deactivate, delete, withdraw) · `neutral` (discard changes: Keep editing / Discard changes, with destructive styling on Discard) · `type-to-confirm` (deactivate employee: type the name).

**Sizes.** Width 400 (mobile: full width minus 32, as a centred dialog, not a sheet). Buttons `h-control-sm`.

**States.** As Modal. The destructive button shows a loading state while the request runs.

**Behaviour.** Initial focus on the safe button (or the required input). Esc = safe action (closes). Scrim click does nothing. Enter never triggers the destructive action.

**Accessibility.** Radix AlertDialog (`role="alertdialog"`), labelled and described.

**RTL.** The button order mirrors.

**Do / Don't.** ✅ "Reject request" / "Keep pending". ❌ "Yes" / "No" / "Are you sure?".

**shadcn base + props.** `alert-dialog.tsx`.
```ts
interface ConfirmDialogProps { open: boolean; onOpenChange: (o: boolean) => void; title: string; description: string; confirmLabel: string; cancelLabel: string; onConfirm: (input?: string) => Promise<void>; variant?: 'destructive' | 'neutral' | 'type-to-confirm'; requireInput?: { label: string; placeholder?: string; match?: string /* type-to-confirm */ }; impact?: React.ReactNode; }
```

**Tokens.** `--scrim`, `--card`, `--border-strong`, `--elev-hard-lg`, `--radius-xl`, `--destructive*`, `--error`, `--error-bg`, `--input`, `--ring`.
