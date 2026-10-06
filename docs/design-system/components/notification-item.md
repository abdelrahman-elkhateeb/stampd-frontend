# Notification item

**Purpose.** One notification row in the bell popover and on the notifications page (FE-15).

**Anatomy.** Unread dot (8px ink, inline-start) · leading visual (actor avatar 36, or status icon in its tint for system events) · text (`--fs-body`, ≤ 90 characters, formula in `content.md`) · time (relative, `--fs-caption` `--muted-foreground`) · chevron (inline-end, `flip-rtl`).

**Variants.** `actor` (a person did something) · `system` (reminder, correction, overdue).

**Sizes.** Min-height 64, padding 12/16 (inline-start 24 to fit the dot).

**States**
| State | Style |
|---|---|
| unread | `--brand-subtle` background, ink dot, text 700, SR prefix "Unread:" |
| read | `--card`, text 500, no dot |
| hover | `--accent` |
| focus-visible | 2px inset `--ring` |

**Behaviour.** The whole row is one link to the deep link (request, attendance day, profile). Clicking marks it read optimistically, then navigates. On the full page: tabs Unread / All, grouped by Today / Yesterday / Earlier, 25 per page with Pagination. Empty: "Nothing new · Decisions on your requests will appear here." (no doodle).

**Accessibility.** `<a>` with the text as its name; the unread state is in the text (sr-only "Unread:"), not only the dot/tint. Time uses `<time dateTime>`.

**RTL.** The dot and avatar move to the right and the chevron flips.

**Do / Don't.** ✅ Actor + past-tense verb + object + date. ❌ Showing data the reader can't otherwise see.

**shadcn base + props.** Custom.
```ts
interface NotificationItemProps { id: string; text: string; createdAt: string; unread: boolean; href: string; actor?: { name: string; userId: string; avatarUrl?: string }; system?: { status: AttendanceStatus | RequestStatus | 'corrected' | 'overdue' }; onOpen?: (id: string) => void; }
```

**Tokens.** `--brand-subtle`, `--foreground`, `--card`, `--accent`, `--ring`, `--muted-foreground`, `--status-*`.
