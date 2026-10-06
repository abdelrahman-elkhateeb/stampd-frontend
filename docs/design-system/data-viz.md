# Data visualisation

Charts appear **only** on the HR/Admin dashboard (FE-13) and in Reports (FE-14). The employee dashboard has none (FE-09). Built on shadcn `Chart` (Recharts). Colours come only from the tokens below.

## Tokens

| Token | Light | Ratio on card | Dark | Ratio on card | Use |
|---|---|---|---|---|---|
| `--chart-1` | #1F6FB2 | 5.20 | #6AAEF0 | 7.22 | Categorical series 1 |
| `--chart-2` | #C2560C | 4.46 | #FF9A5C | 8.11 | Series 2 |
| `--chart-3` | #0F8A66 | 4.26 | #4CCB9F | 8.37 | Series 3 |
| `--chart-4` | #B5508E | 4.59 | #E79ACF | 8.02 | Series 4 |
| `--chart-5` | #4A433B | 9.58 | #D8D0C4 | 11.11 | Series 5 / "Other" |
| `--chart-present` | #1B6E45 | 6.15 | #6FD69B | 9.52 | Trend line, solid |
| `--chart-late` | #B8400A | 5.47 | #FF8C4A | 7.36 | Trend line, dash `8 4` |
| `--chart-absent` | #C0262D | 5.81 | #FF8A8A | 7.48 | Trend line, dot `2 4`, round caps |
| `--chart-grid` | #E2D9CC | decorative | #3A352D | decorative | Horizontal grid only |
| `--chart-axis` | #8F8577 | 3.57 | #857B6E | 4.09 | Axis line, 1px |
| `--chart-label` | #6B6258 | 5.88 | #B3A99B | 7.33 | Tick and axis labels, 11/16 |
| `--chart-tooltip` / `-foreground` | #111111 / #FFFDF9 | 18.59 | #F4EFE7 / #111111 | 16.50 | Tooltip |

Request-type charts (e.g. pending requests by type) use the `--cat-*` fills with a 1px `--cat-border` outline, so the marks meet 3:1 through the outline.

Colour-blind safety, measured with CIEDE2000 + Machado 2009: the worst pair is chart-1/chart-4 under protanopia (ΔE 7.3 light, 6.7 dark). That's below the "clearly different" line of 10, so **rule 1 is mandatory**.

## Rules
1. **Never colour alone.** Every series has a direct end label. Lines have a dash pattern (solid / `8 4` / `2 4`). Stacked bars use pattern fills (solid / 45° diagonal 2px-on-4px / 2px dots), and the legend order equals the stack order.
2. **Axes:** y starts at 0 for counts. Rates may start at a labelled baseline. At most 5 y-ticks. The x axis shows 4–6 date ticks formatted per `formatting.md`.
3. **Grid:** horizontal only. No vertical grid, chart border, 3D, gradients, donuts or pies (use bars).
4. **Tooltip:** `--chart-tooltip` surface, radius md, padding 10/12, text 12/16. Contents: the date in the company timezone, then one row per series: pattern swatch (18×6 SVG line) + label + tabular value. It opens on hover **and** on keyboard focus of a point (←/→ step between points).
5. **Small multiples beat dual axes.** Present (~185) and Late/Absent (~10) never share an axis. Draw two charts side by side.
6. **Empty:** with fewer than 5 data points, show the empty state "Trends appear after your first week" instead of a chart.
7. **RTL:** time axes are never mirrored (dates read left to right). Labels, legend and controls follow the page direction.
8. **Numbers:** 0 decimals on charts, 1 decimal in tables. Format with Intl.
9. **No rankings:** no per-person leaderboards or lateness ranking anywhere (FE-13).

## Accessible table fallback (FE-13 acceptance criterion)
- Every chart card has a `Chart | Table` segmented control (keyboard shortcut `T` while the chart has focus).
- The table contains exactly the plotted data, in the same order, using the Table component (sortable, CSV-exportable).
- The table is **always in the DOM**: visible in Table mode, `sr-only` in Chart mode.
- The SVG has `role="img"` and an `aria-label` summary: series, range and latest value, ending with "Full data in the table view."

## Recipes (FE-13)
| Chart | Form | Colour |
|---|---|---|
| Attendance trend, last 30 working days | Two small-multiple line charts: Present rate (%) · Late & Absent (people) | `--chart-present/late/absent` + dash patterns |
| Leave usage this leave year | Horizontal bars per leave type, used vs entitled (track = `--muted`) | `--cat-leave` + ink outline; type icon + name label |
| Pending requests by type | Horizontal bars, count + age; items over 3 days get the `AlarmClock` flag | `--cat-*` per request type |
| Out this week by department | Horizontal bars sorted by value, top 5 + "Other" | `--chart-1…5` |
