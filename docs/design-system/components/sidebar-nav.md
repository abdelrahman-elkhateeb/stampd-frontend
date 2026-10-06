# Sidebar nav

**Purpose.** Primary navigation on desktop (`md+`), with role-based sections (FE-03): **Me** (Dashboard, Attendance, Leave, Requests, Calendar) · **My team** (Approvals, Team), for Manager and Admin · **Company** (Employees, Attendance review, Reports, Settings), for Admin/HR.

**Anatomy.** Tenant header (logo 32 + tenant ring, company name, role; a switcher chevron only for multi-company users) · section labels (overline style) · nav items (icon 18–20 + label + optional count badge) · footer (user avatar + name + email → user menu).

**Variants.** `expanded` 240 (`xl+`) · `rail` 64 (`md`–`xl`, icons only, tooltips at inline-end, counts become dots). The user's choice is remembered per device.

**Sizes / density.** Item height `h-control-sm` (40), radius pill, padding-inline `--space-3`, gap `--space-3`, text `--fs-body`. Uses the `--sidebar*` tokens.

**Item states**
| State | Style |
|---|---|
| default | text `--sidebar-foreground` (9.58 · 11.11), 500 |
| hover | `--sidebar-accent` / `--sidebar-accent-foreground` |
| active | `--sidebar-primary` (butter) + 1.5px inset `--border-strong`, `--sidebar-primary-foreground`, 700, `aria-current="page"` |
| focus-visible | 2px `--sidebar-ring` inset |

**Behaviour.** Items render only when the role allows them (convenience; the server enforces access, per FE-03). The Approvals count comes from the dashboard summary and is refreshed with the bell poll. Long labels truncate with a tooltip.

**Accessibility.** `<nav aria-label="Main">`. Section labels are headings (`h2` sr-friendly) or `aria-labelledby` groups. Rail items have `aria-label` + tooltip. Counts are in the name ("Approvals, 7 pending").

**RTL.** The sidebar sits on the right. Tooltips open to the left. The rail mirrors.

**Do / Don't.** ✅ Butter only on the active item. ❌ The tenant accent on items. ❌ Hiding items behind hover-only menus.

**shadcn base + props.** `sidebar.tsx` (shadcn Sidebar).
```ts
interface NavItem { id: string; label: string; href: string; icon: LucideIcon; count?: number; roles: ('employee' | 'manager' | 'admin')[]; }
interface AppSidebarProps { sections: { id: 'me' | 'team' | 'company'; label: string; items: NavItem[] }[]; role: 'employee' | 'manager' | 'admin'; tenant: { name: string; logoUrl?: string; roleLabel: string }; user: { name: string; email: string; avatarUrl?: string }; collapsed?: boolean; }
```

**Tokens.** `--sidebar`, `--sidebar-foreground`, `--sidebar-primary*`, `--sidebar-accent*`, `--sidebar-border`, `--sidebar-ring`, `--border-strong`, `--tenant-accent`, `--control-h-sm`.
