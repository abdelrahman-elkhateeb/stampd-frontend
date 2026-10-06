# Chart

**Purpose.** HR/Admin dashboard (FE-13) and Reports (FE-14) visuals. Full rules and tokens: `data-viz.md`.

**Anatomy.** Card · header (title + subtitle with the date range and timezone) · `Chart | Table` segmented control · plot (SVG) · direct series labels · tooltip · the table fallback (always in the DOM).

**Variants.** `line` (trends; small multiples instead of dual axes) · `bar-horizontal` (usage, counts by type or department) · `bar-stacked` (pattern fills required). No pie, donut, area or 3D.

**Sizes.** Plot height 220 (dashboard), 320 (reports). Full card width. Below `md`, it defaults to the Table view.

**States.** loading (skeleton plot) · empty (< 5 points: "Trends appear after your first week") · error (section error) · focused point (2px ring + tooltip).

**Behaviour.** Hover or keyboard focus shows the tooltip. ←/→ step points; `T` toggles Table. Clicking a bar or tile navigates to the filtered list where one exists (FE-13).

**Accessibility.** `<figure>` + `<figcaption>`. The SVG has `role="img"` with an `aria-label` summary ending "Full data in the table view". The table is always present (`sr-only` in Chart mode).

**RTL.** Time axes are not mirrored. Legend, labels and controls follow the direction.

**Do / Don't.** ✅ Direct labels + dash patterns. ❌ Colour-only legends. ❌ Rankings of people.

**shadcn base + props.** `chart.tsx` (Recharts).
```ts
interface StampdChartProps<T> {
  title: string; subtitle: string;
  kind: 'line' | 'bar-horizontal' | 'bar-stacked';
  data: T[];
  series: { key: keyof T; label: string; color: `--chart-${1|2|3|4|5}` | '--chart-present' | '--chart-late' | '--chart-absent' | `--cat-${RequestType}`; dash?: 'solid' | '8 4' | '2 4'; pattern?: 'solid' | 'diagonal' | 'dots' }[];
  xKey: keyof T; yFormat?: (n: number) => string;
  summary: string;               // aria-label
  table: { columns: ColumnDef<T>[] };
  minPoints?: number;            // default 5
}
```

**Tokens.** `--chart-*`, `--cat-*`, `--card`, `--border`, `--ring`.
