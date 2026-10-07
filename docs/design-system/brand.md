# Brand

Visual reference: board 01 (Overview) and 15 (Showcase) in [`reference/stampd-design-system.html`](reference/stampd-design-system.html). Open it in a browser; it unpacks itself.

## Wordmark

The Stampd logo is a **stamp**, built from tokens, not an image: `<Wordmark>` in `packages/ui/src/components/wordmark.tsx`.

| Part | Token |
|---|---|
| Fill | `--brand` (butter) |
| Text | `--brand-foreground`, `--fw-black`, `--fs-h4` |
| Edge | `--bw-bold` `--border-strong`, `--radius-md` |
| Shadow | `--elev-hard-sm` |
| Padding | `--space-1` × `--space-3` |
| Tilt | −3° (never mirrored in RTL) |

- Text is `app.name` from `messages/*.json`. The Arabic wordmark is still open (decision 2); the canvas shows بصمة as a placeholder.
- The stamp counts as the screen section's one butter fill (rule 3).
- Use it in the app header and the auth screens. The tenant logo is separate (`layout.md › Tenant branding`).
- Don't recolour it, use the tenant accent on it, or re-draw it as an image until the final wordmark is chosen.
