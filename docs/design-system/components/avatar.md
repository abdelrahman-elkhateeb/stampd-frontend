# Avatar

**Purpose.** Identify a person (employee, approver, actor in timelines).

**Anatomy.** Circle · photo (`object-fit: cover`) or initials · optional presence dot (inline-end, bottom) · optional tenant ring · group stack with "+N".

**Variants.** `photo` · `initials` (background = `--avatar-{1..6}`, chosen by `hash(userId) % 6`, text `--avatar-foreground`) · `group` (overlap −8px, 2px `--card` border, max 3 + "+N" in `--inverse`).

**Sizes.** 24 (tables, text 10) · 32 (lists, text 12) · 40 (cards, text 14) · 56 (profile, text 18). Font weight 700.

**Initials rule.** First letter of the first name + first letter of the last name (Latin: uppercase; Arabic: «س ع» with a thin space). Max 2 characters.

**States.** Static. Interactive avatars (the user menu) behave as an icon button: ring on focus.

**Behaviour.** Photos are loaded lazily, with initials until they load or if they fail. Photo upload (FE-03 profile): square crop, ≤ 2 MB, JPG/PNG.

**Accessibility.** When next to the visible name: decorative (`alt=""`, initials `aria-hidden`). Standalone: `alt` / `aria-label` = full name. Presence/status is never only the dot; the visible text or the accessible name includes it ("Fatima Al-Zahrani, present").

**RTL.** The presence dot and group overlap use logical insets/margins (`-ms-2`).

**Do / Don't.** ✅ Use the avatar palette only for initials. ❌ Read meaning into the avatar colour. ❌ Use category colours for avatars.

**shadcn base + props.** `avatar.tsx`.
```ts
interface PersonAvatarProps { name: string; userId: string; src?: string; size?: 24 | 32 | 40 | 56; presence?: AttendanceStatus; tenantRing?: boolean; decorative?: boolean; }
interface AvatarGroupProps { people: PersonAvatarProps[]; max?: number; size?: 24 | 32; }
```

**Tokens.** `--avatar-1…6`, `--avatar-foreground`, `--card`, `--inverse*`, `--tenant-accent`, `--status-*` (presence dot), `--radius-pill`.
