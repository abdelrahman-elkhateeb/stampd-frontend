# Icon button

**Purpose.** A compact action whose meaning a familiar icon carries: close, more, filter, add, prev/next, bell.

**Anatomy.** Round container · one Lucide icon · tooltip (500ms delay) with the same text as the `aria-label`. Optional count badge (see notification-bell).

**Variants.** Same as Button: `default` (ink), `outline`, `secondary`, `ghost`. Plus two semantic variants only for dense HR tables: `approve` (bg `--status-approved-bg`, icon `--status-approved`, 1.5px `--border-strong`) and `reject` (bg `--status-rejected-bg`, icon `--status-rejected`). Everywhere else, approve and reject are labelled buttons.

**Sizes / density.** Square `size-control` (48 / 36), `size-control-sm` (40 / 32), `size-control-xs` (32 / 28). The icon uses `size-icon` (20 / 16). Touch hit area ≥ 44 via `::after`.

**States.** As Button: hover background per variant, focus ring 2px + 2px offset, pressed translateY(1px), disabled colours, loading = spinner replaces the icon.

**Behaviour.** The tooltip shows on hover after 500ms and immediately on keyboard focus. It is hidden on touch devices (the label is still read by screen readers).

**Accessibility.** `aria-label` is **required** (TypeScript enforces it). Toggles use `aria-pressed`. Menu triggers use `aria-haspopup` + `aria-expanded`. Make the name specific: "Actions for Sara Al-Otaibi", "Close drawer".

**RTL.** Directional icons (chevrons, arrows) get `flip-rtl`. Close, more and filter don't flip.

**Do / Don't.** ✅ Always round. ❌ Using an icon button for a primary action. ❌ Icons without a universally understood meaning.

**shadcn base + props.** Button with `size="icon"` variants.
```ts
interface IconButtonProps extends Omit<ButtonProps, 'children' | 'leadingIcon' | 'trailingIcon'> {
  icon: LucideIcon;
  'aria-label': string;          // required
  size?: 'default' | 'sm' | 'xs';
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'approve' | 'reject';
  flipIcon?: boolean;
  tooltip?: string | false;      // defaults to aria-label
}
```

**Tokens.** As Button + `--status-approved(-bg)`, `--status-rejected(-bg)`, `--icon`.
