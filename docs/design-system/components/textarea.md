# Textarea

**Purpose.** Multi-line text: reasons (rejection, correction, adjustment), notes, comments.

**Anatomy.** Label · textarea · footer row with helper (start) and character counter (end, tabular).

**Variants.** `default` · `reason` (required, rows 3, counter shown, max 500) · `comment` (optional, rows 2, auto-grows to 6).

**Sizes / density.** Min height 3 rows × `--lh-body-lg` + padding `--space-3`. Text `--fs-ui`. Radius `--radius-md`. `resize: vertical` (none inside dialogs).

**States.** Identical to Input (default, hover, focus, error, disabled, read-only). Counter colour: `--muted-foreground`; within 10% of the limit `--warning`; over the limit `--error` + field error.

**Behaviour.** Reason fields are required wherever the backend requires a reason: rejection (FE-10/11), HR correction (FE-11), balance adjustment (FE-05), leave types with "reason required" (FE-07). Save stays disabled or blocked with a message until filled. Trim whitespace before validation.

**Accessibility.** `<label htmlFor>`. The counter is linked through `aria-describedby` and announced only when within 20 characters of the limit (polite live region). Don't announce every keystroke.

**RTL.** Text direction `auto` (`dir="auto"`), so mixed Arabic and English reasons render correctly.

**Do / Don't.** ✅ Say who will read it ("HR sees this with your request"). ❌ A placeholder that repeats the label.

**shadcn base + props.** `components/ui/textarea.tsx`.
```ts
interface TextareaFieldProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  helperText?: string;
  error?: string;
  maxLength?: number;          // shows counter when set
  autoGrow?: { minRows: number; maxRows: number };
  optional?: boolean;
}
```

**Tokens.** As Input + `--warning`, `--lh-body-lg`.
