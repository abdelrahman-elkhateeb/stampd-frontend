# Checkbox

**Purpose.** Independent on/off choices applied on Save, and row selection in tables.

**Anatomy.** 20×20 box · check or indeterminate dash · label (clickable) · optional helper.

**Variants.** `default` · `table` (no visible label; `aria-label` "Select Sara Al-Otaibi"; select-all supports indeterminate).

**Sizes / density.** The box is always 20 (18 inside compact tables). Hit area ≥ 44 including the label. Radius `--radius-xs`. Gap to the label `--space-3`.

**States**
| State | Style |
|---|---|
| unchecked | 1.5px `--input` border, `--card` fill |
| checked | `--primary` fill, `--primary-foreground` check (stroke 3) |
| indeterminate | `--primary` fill, 10×2.5 `--primary-foreground` bar |
| hover | border `--input-hover` |
| focus-visible | 2px `--ring`, 2px offset |
| disabled | `--disabled` fill, `--disabled-border`; label `--disabled-foreground` |
| error | 1.5px `--error` border, label `--error`, message below |

**Behaviour.** Space toggles. In tables, Shift+click selects a range, and the selection count is announced ("3 selected"). Changes apply on form Save. For immediate effect, use Switch.

**Accessibility.** Radix Checkbox (`role="checkbox"`, `aria-checked="true|false|mixed"`). `<label>` wraps or is `htmlFor`-linked. Groups use `fieldset` + `legend`.

**RTL.** The box sits at inline-start. The check glyph does not flip.

**Do / Don't.** ✅ Positive labels ("Notify my manager"). ❌ A checkbox for exclusive choices (use Radio).

**shadcn base + props.** `checkbox.tsx`.
```ts
interface CheckboxFieldProps { label: string; checked: boolean | 'indeterminate'; onCheckedChange: (v: boolean) => void; helperText?: string; error?: string; disabled?: boolean; hideLabel?: boolean; }
```

**Tokens.** `--input`, `--input-hover`, `--card`, `--primary`, `--primary-foreground`, `--ring`, `--disabled*`, `--error`, `--radius-xs`, `--bw-bold`.
