# Formatting

All examples are real `Intl` output (Node 24 ICU) for `2026-10-06T05:02:00Z` in `Asia/Riyadh`.

## Locales
| Setting | Locale string |
|---|---|
| English | `en-GB` |
| Arabic, Western digits (default) | `ar-u-nu-latn-ca-gregory` |
| Arabic, Eastern digits (tenant option) | `ar-u-nu-arab-ca-gregory` |
| Hijri second line | `ar-SA-u-ca-islamic-umalqura-nu-latn` / `en-GB-u-ca-islamic-umalqura` |

Do **not** use plain `ar-SA` for dates: it defaults to the Hijri calendar and Eastern digits.

## Two kinds of time
1. **Timestamps** (check-in, decided at, created at) are stored in UTC and always formatted with `timeZone: company.timezone`, taken from the current-user response. Never the device zone.
2. **Calendar days** (leave dates, holidays, attendance date) are plain `YYYY-MM-DD` dates. Format them as `new Date(d + 'T00:00:00Z')` with `timeZone: 'UTC'`, so they never shift by a day.

## Reference table

| Use | Options | EN | AR (0–9) | AR (٠–٩) |
|---|---|---|---|---|
| Short date | `{ weekday:'short', day:'numeric', month:'short' }` | Tue 6 Oct | الثلاثاء، 6 أكتوبر | الثلاثاء، ٦ أكتوبر |
| Long date | `{ weekday:'long', day:'numeric', month:'long', year:'numeric' }` | Tuesday, 6 October 2026 | الثلاثاء، 6 أكتوبر 2026 | الثلاثاء، ٦ أكتوبر ٢٠٢٦ |
| Numeric date (tables, CSV) | `{ day:'2-digit', month:'2-digit', year:'numeric' }` | 06/10/2026 | 06/10/2026 | ٠٦/١٠/٢٠٢٦ |
| Month title | `{ month:'long', year:'numeric' }` | October 2026 | أكتوبر 2026 | أكتوبر ٢٠٢٦ |
| Date range | `formatRange` · `{ day:'numeric', month:'short' }` | 11 – 15 Oct | 11–15 أكتوبر | ١١–١٥ أكتوبر |
| Time | `{ hour:'2-digit', minute:'2-digit', hourCycle:'h23' }` | 08:02 | 08:02 | ٠٨:٠٢ |
| Relative · minutes | `RelativeTimeFormat({ numeric:'auto', style:'short' })` `(-2,'minute')` | 2 min ago | قبل دقيقتين | قبل دقيقتين |
| Relative · hours | `(-3,'hour')` | 3 hr ago | قبل 3 ساعات | قبل ٣ ساعات |
| Relative · day | `{ numeric:'auto' }` `(-1,'day')` | yesterday | أمس | أمس |
| Number | `NumberFormat()` | 1,240.5 | 1,240.5 | ١٬٢٤٠٫٥ |
| Percent | `{ style:'percent', maximumFractionDigits:1 }` | 91.2% | 91.2% | ٩١٫٢٪ |
| Duration | `formatDuration(465)` (custom) | 7h 45m | 7س 45د | ٧س ٤٥د |
| Hijri | `{ day:'numeric', month:'long', year:'numeric' }` | 25 Rabiʻ II 1448 AH | 25 ربيع الآخر 1448 هـ | — |

## Rules
- **CSV exports** use the numeric date `DD/MM/YYYY` and `HH:mm`, Western digits always, UTF-8 with BOM (so Arabic names open correctly in Excel, per FE-14).
- **Time** is always 24-hour, including inputs. Show the zone label ("AST") only on correction forms and when the viewer's device zone differs from the company zone.
- **Relative time:** under 60 s = "just now" / «الآن»; under 60 min = minutes; under 24 h = hours; then "yesterday"; from 2 days, the short absolute date. The full date is in a tooltip (`<time dateTime title>`).
- **Ranges** always use `formatRange`; never join two strings by hand.
- **Durations:** `formatDuration(totalMinutes)` returns `"{h}h {m}m"` / `"{h}س {m}د"`. A zero part is omitted ("45m", "8h"); no seconds. Digits go through `NumberFormat` with the tenant's numbering system. Live counters tick every 60 s.
- **Plurals:** ICU messages, e.g. `{count, plural, one {# day} other {# days}}` / `{count, plural, zero {لا أيام} one {يوم واحد} two {يومان} few {# أيام} many {# يومًا} other {# يوم}}`.
- **Digits:** inputs accept both digit systems and normalise to ASCII before validation. Stored values are always ASCII.
- **Hijri** appears only when the tenant enables it, as a caption-size `--muted-foreground` second line under day headers, request details and date pickers. Never in tables or CSV.
- **Week start and working days** come from company settings. They are never hard-coded.

## Reference implementation (to live in `lib/format.ts`)
```ts
type Ctx = { locale: 'en' | 'ar'; digits: 'latn' | 'arab'; timeZone: string };
const loc = (c: Ctx) => c.locale === 'en' ? 'en-GB' : `ar-u-nu-${c.digits}-ca-gregory`;

export const fmtTime = (iso: string, c: Ctx) =>
  new Intl.DateTimeFormat(loc(c), { timeZone: c.timeZone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(iso));

export const fmtDay = (ymd: string, c: Ctx) =>   // plain calendar date
  new Intl.DateTimeFormat(loc(c), { timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'short' }).format(new Date(ymd + 'T00:00:00Z'));

export function formatDuration(totalMinutes: number, c: Ctx) {
  const n = new Intl.NumberFormat(loc(c));
  const h = Math.floor(totalMinutes / 60), m = totalMinutes % 60;
  const [uh, um] = c.locale === 'ar' ? ['س', 'د'] : ['h', 'm'];
  return [h ? n.format(h) + uh : '', m || !h ? n.format(m) + um : ''].filter(Boolean).join(' ');
}
```
