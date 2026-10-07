# Backlog map · FE-01 … FE-15

Source: Trello board "Employee Ops Platform", FRONTEND list (read 2026-10-06). ✅ = gap closed in v0.4 (spec in `components/` / boards 27–29). ✅ = still undefined. ⚑ = conflict between the ticket and a design-system decision.

| Ticket | Components | Patterns / docs | Gaps & conflicts |
|---|---|---|---|
| **FE-01** Foundation, design system & API client | All of `components/`, tokens.css, globals.css, fonts.css | forms-validation, empty-loading-error, rtl, formatting, content | ⚑ Ticket says "light theme"; decision 6 ships light + dark. Update the ticket scope and add dark QA to the component gallery AC. Component gallery = the showcase (board 15) rebuilt as a dev route |
| **FE-02** Auth & onboarding | input, button, checkbox, card, toast, error-state, empty-state | forms-validation, content (error copy: "Email or password is incorrect") | ✅ Password field + strength hint · ✅ Setup checklist (dismissible, progress saved) · ✅ Auth page shell (logo 48 + tenant ring, centred 400 card) |
| **FE-03** App shell, nav & guards | sidebar-nav, bottom-nav, top-bar, notification-bell (slot), avatar, badge, error-state (403/404/boundary), toast | layout (shells), rtl | ✅ User menu (DropdownMenu spec) · ✅ Command palette (global search) · ✅ Photo upload (file upload) |
| **FE-04** Company settings, holidays, leave & request types | input, select, switch, time-input, date-picker, table, confirm-dialog (holiday impact), modal, card | forms-validation (unsaved changes), destructive-confirm, layout › Tenant branding | ⚑ Default week: ticket Mon–Fri vs decision 14 Sun–Thu · ⚑ Leave-type **colour** → proposed **icon picker** (decision 21) · ✅ Icon picker · ✅ Weekday toggle group · ✅ Number input with stepper (allowance, grace minutes) · ✅ Logo upload (file upload) · ✅ Settings history list (timeline) |
| **FE-05** Employees & departments | table, filters-bar, select (combobox: manager), status-chip (account: invited/active/deactivated), avatar, drawer, confirm-dialog (deactivate, type-to-confirm + impact), textarea (adjustment reason), pagination | forms-validation, destructive-confirm | ✅ CSV import wizard (stepper + file dropzone + preview table with row errors) · ✅ Change history (timeline) · ✅ Ledger table variant (signed amounts, running balance) |
| **FE-06** Attendance: check-in/out, today & history | button (brand hero), card (hero), status-chip, calendar (attendance-month), segmented-control, drawer (day detail), toast, skeleton | formatting (durations, live counter), empty-loading-error | ✅ **Today card** composite spec (status, check-in/out, sessions, live counter, warnings: leave/holiday) · ✅ Sessions list · ✅ Month summary strip · ✅ Timeline (old/new values with reason) |
| **FE-07** Leave: balances, history & request flow | stat-tile, card, date-range-picker (leave variant), radio-group (half days), textarea, table, status-chip, category-chip, drawer (desktop form), confirm-dialog (withdraw/cancel) | forms-validation (preview-driven submit), destructive-confirm | ✅ **Balance card** composite (available/pending/upcoming/used/entitlement + progress bar) · ✅ Live preview panel · ✅ Progress bar · ✅ Ledger table |
| **FE-08** My Requests hub | radio-group (card variant: type picker), date-picker, date-range-picker, time-input (range), input, textarea, table/list, filters-bar, status-chip, category-chip, drawer/page (detail), confirm-dialog | forms-validation, destructive-confirm, content (lifecycle names) | ✅ **Timeline** (status history with actor/time/comment) · ✅ Generic metadata-driven form renderer (pattern) |
| **FE-09** Employee dashboard | card (hero Today), stat-tile (balances), button, list rows, avatar group ("Who's out", as Out), empty-state, skeleton | layout (mobile shell: Today above the fold), empty-loading-error | ✅ Today card (see FE-06) · ✅ Activity feed item (can reuse notification-item) |
| **FE-10** Manager: dashboard, approvals & team | stat-tile, tabs (Pending/Decided), table / approval card, drawer (review below lg), confirm-dialog (reject), toast (Undo), badge (nav count), calendar (attendance-month, read-only), empty-state (caught-up) | approve-reject, destructive-confirm, layout (split view) | ✅ Review panel composite spec (balance after + teammates out) |
| **FE-11** HR attendance review & corrections | table (compact), filters-bar, date-picker, calendar (attendance-month: employees × days), tabs (Day / Month / Exceptions / Corrections), drawer (wide: correction editor), time-input (session), textarea (reason), status-chip (+ corrected flag) | approve-reject (corrections queue), forms-validation | ✅ Correction editor composite (sessions add/remove + live status preview) · ✅ Timeline / day history panel |
| **FE-12** Company calendar | calendar (month/week/list), switch (show pending), filters-bar, popover/sheet (day list), category-chip (legend) | rtl, iconography | — (fully specified in v0.3) |
| **FE-13** HR/Admin dashboard | stat-tile (7 today tiles, link), chart (trend, leave usage, pending by type), table (fallback), empty-state, skeleton | data-viz, empty-loading-error | ✅ Setup checklist card (shared with FE-02) |
| **FE-14** Reports + CSV export | tabs, filters-bar (presets, URL), date-range-picker (report variant, 13-month limit), table (report: sticky header, totals row), pagination, toast (progress), empty-state | formatting (CSV rules: UTF-8 BOM, numeric dates) | — |
| **FE-15** Notifications & a11y hardening | notification-bell, notification-item, switch (email preferences), error-state (offline), toast | A11y checklist (board 25), content, rtl | — |

## v0.4: gaps closed
| # | Gap | Spec | Board |
|---|---|---|---|
| 1 | Timeline (status + change history) | `components/timeline.md` | 29 |
| 2 | Today card | `components/today-card.md` | 27 |
| 3 | Balance card + progress bar | `components/balance-card.md`, `components/progress-bar.md` | 27 |
| 4 | File upload / dropzone | `components/file-upload.md` | 28 |
| 5 | Stepper / wizard (CSV import) | `components/stepper.md` | 28 |
| 6 | Setup checklist | `components/setup-checklist.md` | 28 |
| 7 | Password field + strength | `components/password-field.md` | 28 |
| 8 | Icon picker (leave types) | `components/icon-picker.md` | 28 |
| 9 | Weekday toggle group + number stepper | `components/weekday-toggle.md`, `components/number-stepper.md` | 28 |
| 10 | Dropdown/user menu, tooltip, command palette | `components/dropdown-menu.md`, `components/tooltip.md`, `components/command-palette.md` | 29 |
| 11 | Review panel, correction editor, live preview, ledger | `components/review-panel.md`, `components/correction-editor.md`, `components/leave-preview.md`, `components/ledger-table.md` | 27, 29 |
| 12 | Metadata-driven request form | `patterns/request-form-renderer.md` | 29 |

Composites for the auth page shell (FE-02), sessions list and month summary strip (FE-06) reuse existing parts: card + today-card sessions rows + stat tiles. No new components are needed.

## Ticket updates

FE-01 was updated on Trello on 2026-10-07 (light + dark, split into FE-01a/b/c). Still open:
- FE-04: default working days → decide Sun–Thu (GCC) vs Mon–Fri; leave-type colour → icon.
- FE-12: "colour + icon + text per type" → "category colour per request type + icon; leave types by icon".
