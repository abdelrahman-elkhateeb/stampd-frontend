# Iconography

Source: `lucide-react`, imported by name. **One icon per meaning, everywhere.** Never redraw an icon or swap it for a "similar" one.

## Sizes & stroke

| Size | Stroke | Where |
|---|---|---|
| 12 | 2.5 | Month-cell status glyph next to the 4px bar |
| 14 | 2.25 | Small chips (`h-chip-sm`), count badges, inline helper/error text |
| 16 | 2 | `size-icon` in compact density: chips, table rows, menus, compact buttons, inputs |
| 20 | 1.75 | `size-icon` in comfortable density: buttons, nav items, inputs, toasts, top bar |
| 24 | 1.5 | Empty/error states and alert dialogs (inside a 44–56px tinted circle) |

```tsx
<Clock className="size-icon" strokeWidth={1.75} aria-hidden />
```

## Rules
- Icons inherit `currentColor`. Only status icons take a status colour, and only inside their chip or cell.
- Decorative icons next to text: `aria-hidden="true"`. Icon-only buttons: `aria-label` plus a tooltip with the same words.
- **Flip in RTL** (`className="flip-rtl"`): arrow-left/right, chevron-left/right, log-in, log-out, plane, undo-2, redo-2, external-link, send.
- **Never flip:** clocks, check/x, search, media, chart and time axes, logos, mascots, icons containing letters or digits.
- No emoji in UI. No filled variants.

## Statuses
| Meaning | Lucide | Flip |
|---|---|---|
| Present | `CircleCheck` | |
| Late | `ClockAlert` | |
| Absent | `CircleX` | |
| WFH | `House` | |
| On Leave | `Umbrella` | |
| Business Trip | `Plane` | ↔ |
| Holiday | `Sun` | |
| Missing Checkout | `LogOut` | ↔ |
| Not yet checked in | `Clock` | |
| Out | `CalendarOff` | |
| Pending | `Hourglass` | |
| Approved | `Check` | |
| Rejected | `X` | |
| Withdrawn | `Undo2` | ↔ |
| Cancellation requested | `CalendarX` | |
| Cancelled | `Ban` | |
| Invited / Active / Deactivated | `Mail` / `UserCheck` / `UserX` | |
| Corrected (flag) | `PencilLine` | |
| Overdue > 3 days (flag) | `AlarmClock` | |

## Request types & leave types
| Meaning | Lucide | Category token |
|---|---|---|
| Leave (request type) | `Umbrella` | `--cat-leave` |
| WFH request | `House` | `--cat-wfh` |
| Business trip | `Plane` ↔ | `--cat-trip` |
| Permission / early leave | `DoorOpen` | `--cat-permission` |
| Attendance correction | `FileClock` | `--cat-correction` |
| Annual · Sick · Emergency · Unpaid · Hajj · Maternity · Other | `TreePalm` · `Thermometer` · `Siren` · `Banknote` · `Landmark` · `Baby` · `CalendarPlus` | all `--cat-leave` |

Leave types are told apart by icon, so the FE-04 leave-type form offers an **icon picker** from the list above (see backlog-map).

## Navigation (FE-03)
Dashboard `LayoutDashboard` · Attendance `Fingerprint` · Leave `Umbrella` · Requests `FileText` · Calendar `CalendarDays` · Approvals `Inbox` · Team `Users` · Employees `IdCard` · Attendance review `ClipboardCheck` · Reports `ChartColumn` · Settings `Settings` · Profile `CircleUser` · Notifications `Bell`

## Actions & system
Check in `LogIn` ↔ · Check out `LogOut` ↔ · New `Plus` · Edit `Pencil` · Delete `Trash2` · Export `Download` · Import `Upload` · Filters `ListFilter` · Search `Search` · Sortable `ArrowUpDown` · Row actions `Ellipsis` · Close/remove `X` · Back `ArrowLeft` ↔ · Previous `ChevronLeft` ↔ · Next/disclosure `ChevronRight` ↔ · Menu `Menu` · New tab `ExternalLink` ↔ · Copy `Copy` · Retry `RefreshCw` · Send invite `Send` ↔ · Info `Info` · Warning `TriangleAlert` · Error `CircleAlert` · Offline `WifiOff`
