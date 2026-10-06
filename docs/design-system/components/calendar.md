# Calendar (company calendar, FE-12; attendance month, FE-06/FE-11)

**Purpose.** Show plans over time: leave, WFH, business trips, permissions, holidays (FE-12). A separate attendance mode shows a person's daily statuses (FE-06 My Attendance, FE-11 month grid). The shared calendar **never** shows attendance actuals.

**Anatomy.** Toolbar (prev · month title · next · Today · filters: department / My team / employee / type · "Show pending" switch for approvers · Month/Week/List segmented) · legend · weekday header · grid (month: 6×7 cells, 132px tall) · cell: date number + availability summary ("4 out · 2 WFH"), holiday banner, up to 3 event rows, "+N more".

**Views.** `month` (default, `md+`) · `week` (7 columns, unlimited stack) · `list` (default below `md`: days with events only, sticky day headers) · `attendance-month` (FE-06/11: one person or employees × days, each cell = date + 4px status bar + 12px status icon).

**Event rendering**
| Element | Spec |
|---|---|
| Event chip | 20px, `--cat-*` fill, 3px `--border-strong` bar at inline-start on the first day, 12px type icon, name 11/600. Multi-day: continuous bar, radius only at the ends, name repeated at each week start |
| Pending (approvers, "Show pending" on) | 45° stripe of the category fill on `--card`, 1.5px dashed `--border-strong`, prefixed "Pending ·" |
| Holiday | Full-width banner at the top of the cell, `--status-holiday-bg` / `--status-holiday` + `Sun` icon, spans every holiday day |
| Today | Date in a `--brand-subtle` circle with a 1.5px `--border-strong` ring, `aria-current="date"` |
| Non-working day | `--muted` cell, muted date, no summary |
| Overflow | Max 3 rows per cell (the banner counts). "+N more" opens the day list: popover (desktop) or sheet (mobile) |
| Attendance bars | Late solid · Missing checkout dash 8/4 · Pending dot 3/3 · others solid, plus the icon (board 17 proof) |

**Privacy (FE-12, FE-15).** Employee view: colleagues appear as neutral "Out" chips (`--status-out`, `CalendarOff`), with no type or reason. Manager: type + dates for direct reports. HR: all. Event click opens details within that permission; approvers get a link to the request. Rejected and cancelled requests never appear.

**Sizes / density.** Month cell min-height 132 (desktop). List items min-height 44. Text 11–14px per the anatomy above.

**Behaviour.** The month, view, filters and pending toggle are in the URL. Week start and working days come from company settings. Dates follow the company timezone. With 8 people out, the cell shows the summary, and the full list opens on click (FE-12 AC). No external sync (out of MVP).

**Accessibility.** `role="grid"`. Each `gridcell` has an `aria-label` like "Tuesday 13 October, 4 out, 2 WFH, holiday: …". Arrows move between days, Enter opens the day list, and Tab moves into the events of the focused day. Events are buttons named "{name}, {type}, {dates}" (or "{name}, out" for employees).

**RTL.** The grid mirrors (week start on the right). Multi-day bars run right to left. Arrows flip.

**Do / Don't.** ✅ Plans only on the shared calendar. ❌ Late or absent on the shared calendar. ❌ Category colours for statuses.

**shadcn base + props.** Custom grid (date-fns + Intl), Popover, Sheet, Segmented control.
```ts
interface CompanyCalendarProps {
  month: string;                         // 'YYYY-MM'
  view: 'month' | 'week' | 'list';
  events: { id: string; personName: string; type: RequestType | 'out'; leaveTypeIcon?: LucideIcon; from: string; to: string; pending?: boolean; meta?: string; href?: string }[];
  holidays: { date: string; name: string }[];
  summaries: Record<string, { out: number; wfh: number; trip?: number }>;
  workingDays: number[]; weekStartsOn: 0 | 1 | 6;
  canSeePending: boolean;
  onNavigate: (month: string) => void; onViewChange: (v: CompanyCalendarProps['view']) => void;
}
```

**Tokens.** `--cat-*`, `--status-holiday*`, `--status-out*`, `--status-*` (attendance mode), `--brand-subtle`, `--border-strong`, `--muted`, `--card`, `--border`, `--accent`.
