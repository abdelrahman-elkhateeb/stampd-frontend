# Today card (composite) · v0.4

**Purpose.** The employee's daily attendance hub (FE-06), first on the dashboard (FE-09), above the fold at 360×640.

**Anatomy.** Header: "Today · {short date}" + status chip (`sm`) · big value (clock time before check-in, worked duration after) · context line (shift, grace end) · optional progress bar (shift progress) · sessions list · optional warning note · primary action.

**States**
| State | Card | Value | Action |
|---|---|---|---|
| not-checked-in | hero | current company time | `brand` hero "Check in" |
| checked-in (open session) | hero | live worked duration + progress bar | `brand` hero "Check out" |
| checked-out | default (level 1) | total worked; all sessions listed | `outline` "Check in again" |
| warning: holiday / non-working day / approved leave | hero + `info` note ("Today is a company day off. You can still check in…") | as above | "Check in anyway" |
| missing yesterday | adds a `warning` row "You didn't check out on Mon 5 Oct · Request correction" (FE-06 link to the correction form) | | |
| loading | skeleton `today-card` | | |
| error | inline error under the button + Retry toast; state unchanged | | |
| offline | button label "Check in when online"; the action is queued and the note shown | | |

**Behaviour.**
- Only one primary action at a time. The current clock action is the screen's only butter element.
- Never two open sessions (FE-06).
- The live duration is the sum of closed sessions + (server now − open start). It updates every 60 s and is computed with `serverTimeOffset` from the API, never device time.
- Clicking puts the button straight into its loading state, with an idempotency key. One tap = one request = one session (FE-06 AC).
- On success: status chip updates (Present or Late, as decided by the server), toast "Checked in at 08:02", recent activity refreshes without a reload (FE-09 AC).

**Accessibility.** `<section aria-labelledby>` (title "Today"). The live value has `aria-live="off"` and is read on focus as "Worked 4 hours 12 minutes". Status changes are announced once ("Checked in, present"). The progress bar has `role="progressbar"` with `aria-valuetext` = "47% of shift".

**RTL.** The header and sessions mirror. Times stay `dir="ltr"` inside `<bdi>`.

**Do / Don't.** ✅ Times only in company time. ❌ Location, camera or tracking prompts (FE-06). ❌ A second butter element on the dashboard.

**Props.**
```ts
interface TodayCardProps {
  date: string;                                   // plain date
  status: AttendanceStatus;
  shift: { start: string; end: string; graceEnd?: string };
  sessions: { in: string; out?: string }[];       // ISO, company tz applied in render
  serverTimeOffsetMs: number;
  warning?: { kind: 'holiday' | 'non-working' | 'on-leave' | 'missing-yesterday'; text: string; href?: string };
  onCheckIn: () => Promise<void>; onCheckOut: () => Promise<void>;
  offline?: boolean; loading?: boolean;
}
```

**Tokens.** `--card`, `--border-strong`, `--elev-hard`, `--brand*`, `--status-*`, `--info*`, `--warning*`, `--muted`, `--fs-numeric`, `--fw-black`.
