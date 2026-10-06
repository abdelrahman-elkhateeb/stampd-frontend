# Notification bell

**Purpose.** Entry point to in-app notifications (FE-15): unread count plus the latest items.

**Anatomy.** Icon button (`Bell`, 40 desktop / 44 mobile) · count badge `alert` at top/inline-end · popover (desktop, 400px) or full page (mobile).

**Variants.** `desktop` (popover) · `mobile` (navigates to `/notifications`).

**States**
| State | Badge | Accessible name |
|---|---|---|
| 0 unread | none | "Notifications" |
| 1–9 | number | "Notifications, 3 unread" |
| ≥ 10 | "9+" | "Notifications, 12 unread" |
| open | button `aria-expanded="true"`, background `--secondary` | |

**Popover anatomy.** Header ("Notifications" + "Mark all read" link) · up to 8 `notification-item`s · footer link "See all notifications". Max height 480 (scrolls), `--popover`, `--elev-pop`, `--radius-lg`.

**Behaviour.** Poll `GET /notifications/unread-count` every 60 s and on route change (no sockets, per FE-15). When the count increases, a polite live region announces the newest item's text, at most once per poll. "Mark all read" sets the count to 0 optimistically (FE-15 AC). Opening the popover does **not** mark items read; opening an item does.

**Accessibility.** Button with `aria-haspopup="dialog"`, `aria-expanded`, and a dynamic `aria-label`. The popover is a `dialog` labelled "Notifications", and focus moves to the first item. Esc closes and returns focus.

**RTL.** The badge sits at the top inline-end. The popover aligns to the inline-end edge of the button.

**Do / Don't.** ❌ Pulsing or animated badges. ❌ Revealing colleague leave types in item text.

**shadcn base + props.** `popover.tsx` + IconButton + Badge.
```ts
interface NotificationBellProps { unreadCount: number; items: NotificationItemProps[]; onMarkAllRead: () => Promise<void>; seeAllHref: string; variant?: 'desktop' | 'mobile'; }
```

**Tokens.** `--status-absent` (badge), `--card` (badge ring), `--secondary`, `--popover`, `--elev-pop`, `--border`.
