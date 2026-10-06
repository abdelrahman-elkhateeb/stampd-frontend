# Input (text field)

**Purpose.** Single-line text entry: names, email, employee code, search, phone.

**Anatomy.** Label (above) · control (optional leading icon, text, optional trailing affix or clear button) · helper text or error message (below).

**Variants.** `text` · `email` / `tel` / `url` (`dir="ltr"`) · `search` (leading `Search` icon, clear button, optional `/` kbd hint) · `number` (tabular, `inputmode="decimal"`, no spinners).

**Sizes / density.** Height `h-control` (48 / 36). Padding-inline `--space-3` (14 in the design: use `px-3.5`). Text `--fs-ui`, label `--fs-body` 600, helper `--fs-body-sm`. Radius `--radius-md`.

**States**
| State | Border | Background / text | Other |
|---|---|---|---|
| default | 1px `--input` (3.28:1) | `--card` / `--foreground`; placeholder `--muted-foreground` (5.41:1) | |
| hover | `--input-hover` | | |
| focus-visible | `--border-strong` + 2px `--ring` outline, 2px offset | | |
| filled | as default | | |
| error | 1.5px `--error`; label `--error` | | `aria-invalid`, message with `CircleAlert` 14px |
| disabled | `--disabled-border` | `--disabled` / `--disabled-foreground` | helper explains why ("Set by HR") |
| read-only | 1px dashed `--input` | transparent / `--foreground` | Copyable; helper says where to change it |
| loading (async check) | default | trailing 16px spinner | helper "Checking availability…" |

**Behaviour.** Validation timing: see `patterns/forms-validation.md`. Search inputs debounce 300ms (FE-05 AC: results within 300ms of the typing pause). Digits in either system are normalised to ASCII on change.

**Accessibility.** `<label htmlFor>`, always visible. `aria-describedby` → helper + error ids. `aria-invalid` on error. The required state goes in the label text ("(optional)" marks the exceptions). Never use the placeholder as the label.

**RTL.** Text aligns to start. LTR-content types (email, phone, URL, code) get `dir="ltr"` and `text-end` in RTL. The leading icon moves to the right in RTL automatically.

**Do / Don't.** ✅ One-sentence helper text. ✅ Show the format via helper text ("e.g. EMP-0142"). ❌ Floating labels. ❌ Validating on first focus.

**shadcn base + props.** `components/ui/input.tsx` wrapped by `FormField`.
```ts
interface TextFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label: string;
  helperText?: string;
  error?: string;              // sets aria-invalid + message
  optional?: boolean;          // appends "(optional)"
  leadingIcon?: LucideIcon;
  trailing?: React.ReactNode;  // affix, clear button, spinner
  loading?: boolean;
  ltr?: boolean;               // force dir="ltr" for email/phone/codes
}
```

**Tokens.** `--card`, `--foreground`, `--muted-foreground`, `--input`, `--input-hover`, `--border-strong`, `--ring`, `--error`, `--disabled*`, `--control-h`, `--fs-ui`, `--radius-md`, `--bw-hair`, `--bw-bold`.
