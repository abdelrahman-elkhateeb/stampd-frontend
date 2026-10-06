# Switch

**Purpose.** A setting that takes effect **immediately**: email preferences (FE-03/FE-15), "Show pending" on the calendar (FE-12), request type on/off (FE-04 settings list), Hijri dates (tenant).

**Anatomy.** Label (start) · track 44×26 with a thumb (end) · optional description below the label.

**Variants.** Default only.

**Sizes / density.** Track 44×26, padding 3, thumb 20 (on) / 18 with a 1px border (off). Row min-height 44.

**States**
| State | Track | Thumb |
|---|---|---|
| off | `--accent-strong` + 1px `--input` | `--card` + 1px `--input` |
| on | `--primary` | `--brand` (13.87:1 on ink) |
| focus-visible | 2px `--ring`, 2px offset | |
| disabled (set by tenant/role) | `--disabled-border` | `--disabled`; description says who controls it |
| saving | thumb shows a 12px spinner; reverts with a toast on failure | |

**Behaviour.** A toggle saves optimistically and confirms with a quiet toast only on error. The thumb slides to inline-end over `--dur-fast`. If the change has consequences (disabling Business Trip hides it for all employees, per FE-04), show the description inline. No confirm dialog.

**Accessibility.** Radix Switch (`role="switch"`, `aria-checked`). The label is the accessible name. The state change is announced by the screen reader natively.

**RTL.** The thumb "on" position is inline-end, so it mirrors automatically.

**Do / Don't.** ✅ Name what turns on ("Email me about decisions"). ❌ A switch inside a form that has a Save button (use Checkbox). ❌ Location or tracking prompts (FE-06).

**shadcn base + props.** `switch.tsx`.
```ts
interface SwitchFieldProps { label: string; description?: string; checked: boolean; onCheckedChange: (v: boolean) => Promise<void> | void; disabled?: boolean; disabledReason?: string; }
```

**Tokens.** `--primary`, `--brand`, `--accent-strong`, `--input`, `--card`, `--ring`, `--disabled*`, `--dur-fast`.
