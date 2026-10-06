# Status chip

**Purpose.** Show **what happened**: attendance states and request states. It is never interactive and never coloured without an icon and a label.

**Anatomy.** Tinted container · status icon (Lucide, see `iconography.md`) · label · optional qualifier ("· 14m", "· step 1 of 2").

**Variants (shape carries the family)**
| Family | Shape | Statuses |
|---|---|---|
| Attendance / availability | Pill (`--radius-pill`) | present, late, absent, wfh, leave, trip, holiday, missing (dashed), not-yet, out |
| Request | Tag (`--radius-sm`) | pending, approved, rejected, withdrawn, cancel-requested (dashed), cancelled |
| Account (FE-05) | Tag | invited (`--info`), active (`--success`), deactivated (`--status-cancelled`) |
| Flag | Small tag, icon + short word | corrected (`--info`, `PencilLine`), overdue (`--warning`, `AlarmClock`) |

**Dashed = needs action:** Missing checkout and Cancellation requested get a 1px dashed `currentColor` border.

**Colours (fg / bg · light ratio · dark ratio)**
present #1B6E45/#DDF3E6 5.36 · 8.64 · late #B8400A/#FFE4D0 4.57 · 6.84 · absent #C0262D/#FBE0E0 4.74 · 7.12 · wfh #1D5FD1/#DEE8FB 4.72 · 7.60 · leave #7038C4/#ECE2FB 5.52 · 7.70 · trip #0F7480/#D8F1F3 4.65 · 8.11 · holiday #B0306E/#FADDEB 4.75 · 7.45 · missing #8A5A00/#FBEBC0 5.01 · 8.63 · not-yet #6B6258/#EFE8DF 4.92 · 6.49 · out #4A433B/#EFE8DF 8.01 · 9.84 · pending/cancel-requested #8A6100/#FBF0CC 4.86 · 8.63 · approved = present · rejected = absent · withdrawn/cancelled #5E5850/#ECE7E0 5.71 · 9.84.

**Sizes / density.** `md`: `h-chip` (28), icon 16, text `--fs-body-sm` 600, padding-inline 8/12. `sm`: `h-chip-sm` (22), icon 12–14, text `--fs-caption` 600, padding 6/8 (tables, calendars, tiles). `bar`: the 4px calendar bar (Late solid · Missing dash 8/4 · Pending dot 3/3) + 12px icon. See board 17.

**States.** Static: no hover or focus.

**Behaviour.** Labels come only from `content.md` keys (FE-15: identical names everywhere). A qualifier is optional and short. Availability for colleagues uses `out` (never the leave type) unless the viewer is the approver or HR.

**Accessibility.** A `<span>` with visible text, and the icon `aria-hidden`. The label carries the meaning; no `aria-label` override. Within tables, the cell text is the status.

**RTL.** Icon at inline-start. Plane and log-out icons flip.

**Do / Don't.** ✅ Always icon + label. ❌ Colour dots alone. ❌ Making chips clickable (use a link or button nearby). ❌ Category colours for states.

**shadcn base + props.** `badge.tsx` (extend variants).
```ts
type AttendanceStatus = 'present'|'late'|'absent'|'wfh'|'leave'|'trip'|'holiday'|'missing'|'not-yet'|'out';
type RequestStatus = 'pending'|'approved'|'rejected'|'withdrawn'|'cancel-requested'|'cancelled';
interface StatusChipProps { status: AttendanceStatus | RequestStatus | 'invited'|'active'|'deactivated'|'corrected'|'overdue'; size?: 'md'|'sm'; qualifier?: string; }
// label + icon resolved from a single map: statusMeta[status] = { icon, i18nKey, family, dashed }
```

**Tokens.** `--status-*`, `--status-*-bg`, `--info*`, `--success*`, `--warning*`, `--chip-h`, `--chip-h-sm`, `--radius-pill`, `--radius-sm`, `--bw-hair`.
