# Toast

**Purpose.** Brief, non-blocking feedback after an action: approved (with Undo), saved, export ready, a failed submit with Retry, offline.

**Anatomy.** Inverted surface · 24px status circle (tint + icon) · message (`--fs-body`, ≤ 2 lines) · optional action button (Undo on `--brand`, Retry as an outline on inverse) · close on hover/focus.

**Variants.** `success` · `error` · `info` · `progress` (spinner, no auto-dismiss until done) · `undo` (success + Undo).

**Sizes.** Width 380 (mobile: full width minus 32). Padding 12/12/12/16. Radius `--radius-lg`.

**Style.** `--inverse` / `--inverse-foreground` (18.59 light · 16.50 dark), `--elev-pop`. Status circle uses the `--status-*-bg` / `--status-*` pairs.

**Timing.** info/success 5 s · with an action 8 s · error stays until dismissed · progress until it resolves. Hover or focus pauses the timer. Max 3 visible, newest nearest the edge.

**Position.** Desktop: bottom inline-end, 24px from the edges. Mobile: top, below the top bar (so it never covers the bottom nav or the check-in button).

**Behaviour.** Never put critical information only in a toast (errors that block also show inline). Undo reverts optimistically and cancels the pending server commit.

**Accessibility.** Sonner region (F8 to focus it). success/info = `role="status"`, error = `role="alert"`. Actions are real buttons and reachable by keyboard. The toast doesn't steal focus.

**RTL.** It anchors at the bottom-left in RTL, and its content mirrors.

**Do / Don't.** ✅ "Approved Sara's leave". ❌ "Success!". ❌ Toasts for form validation errors.

**shadcn base + props.** `sonner.tsx` with custom renderers.
```ts
type StampdToast = { kind: 'success' | 'error' | 'info' | 'progress' | 'undo'; message: string; action?: { label: string; onClick: () => void }; promise?: Promise<unknown> /* progress */; };
declare function notify(t: StampdToast): string; // returns id
```

**Tokens.** `--inverse*`, `--inverse-border`, `--brand*`, `--status-*`, `--elev-pop`, `--radius-lg`, `--dur-slow`.
