# Skeleton

**Purpose.** A placeholder with the same dimensions as the content, shown while it loads, so nothing jumps.

**Anatomy.** `--muted` blocks with radii that mirror the real elements: text lines `--radius-sm` (12–14px tall, widths 40–70%), avatars round, chips pill, cards `--radius-lg`.

**Variants.** `text` · `avatar` · `chip` · `card` · `table-rows` (n rows at `h-row`) · `stat-tile` · `today-card`.

**Behaviour.** Appears only after 300 ms (fast loads never flash). A shimmer sweeps across (linear gradient `--muted` → `--accent-strong` → `--muted`, 1.6 s, infinite); under reduced motion it is static. Replaced in one swap when the data arrives (no staggered pop-in). Buttons never use skeletons; they use their loading state.

**Accessibility.** The container has `aria-busy="true"` and sr-only text "Loading {thing}" (announced once). Skeleton blocks are `aria-hidden`.

**RTL.** Ragged line ends sit at inline-end.

**shadcn base + props.** `skeleton.tsx`.
```ts
interface SkeletonProps { variant?: 'text' | 'avatar' | 'chip' | 'card'; width?: string; lines?: number; }
interface TableSkeletonProps { rows?: number; columns: number; }
```

**Tokens.** `--muted`, `--accent-strong`, `--radius-sm`, `--radius-lg`, `--radius-pill`, `--row-h`.
