# Pattern · Forms & validation

Used by: FE-02, FE-04, FE-05, FE-07, FE-08, FE-11 and every profile/settings form.
Stack: `react-hook-form` + `zod` + shadcn `Form` (`FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormDescription`, `FormMessage`).

## Structure
- One column. The label sits above the field (`text-body font-semibold`). No floating labels, and the placeholder is never the label.
- Fields are required by default; optional ones get "(optional)" in `--muted-foreground`. No asterisks.
- Related fields are grouped under an `h3`. Max form width 640.
- Field gap `gap-4` (16); label → control `gap-1.5` (6); control → helper `gap-1.5`.
- The primary action goes at the end of the form, at inline-end (desktop), or in the sticky full-width action bar (mobile form pages).

## When to validate
| Moment | Behaviour |
|---|---|
| First focus | Nothing |
| Blur after the field was edited | Validate that field (`mode: 'onTouched'`) |
| Typing in a field that shows an error | Re-validate on every change, so the error clears as soon as it is fixed (`reValidateMode: 'onChange'`) |
| Submit | Validate everything. If there are errors, show the **error summary** at the top and move focus to it |
| Server response | Map field errors to fields (FE-01 AC). Others → section alert above the actions. Never clear user input |

Pre-validation beats errors: disable impossible dates in pickers, show live previews (leave days, balance after), and prefill known values (today, default type, manager).

**Submit disabled** only when the server-side preview already says the request is invalid (FE-07: insufficient balance, overlap, no working days; FE-04/05: a missing required reason). The disabled button gets `aria-describedby` pointing to the visible reason.

## Error summary
```
<div role="alert" tabindex="-1" class="rounded-md bg-error-bg p-4 text-error">
  <strong>Fix 2 things to submit</strong>
  <a href="#end-date">End date is before start date</a>
  <a href="#reason">Reason is required for sick leave over 2 days</a>
</div>
```
Each link moves focus to its field. The summary is removed as soon as all errors are fixed.

## Field error
- The border becomes `border-[1.5px] border-error`, and the label colour `text-error`.
- The message below uses `CircleAlert` 14px + text in `text-body-sm text-error`, and is linked with `aria-describedby`. The field gets `aria-invalid="true"`.
- Message formula: see `content.md`.

## Unsaved changes (FE-04, FE-05)
On navigation with dirty state: confirm dialog "Discard changes?", with **Keep editing** (default focus) and **Discard changes** (destructive). Browser unload uses the native `beforeunload` prompt. Long forms autosave a draft every 5 s to sessionStorage (no server drafts in MVP, per FE-08).

## Submit lifecycle
Button loading state (width locked, spinner, "Submitting…") → success: toast + navigate to the detail page or show the confirmation state (FE-07: status Pending + link). On failure: inline/section error and the button is restored. Idempotency key per submit, so a retry never duplicates (FE-15 AC).

## Accessibility
`<form noValidate>` (custom messages). Every control has a `<label htmlFor>`. Groups (radios, time segments) use `fieldset` + `legend` or `role="group" aria-labelledby`. The required state is in the label text, not just `aria-required`.

## RTL
Labels and messages align to start. Email, phone, IBAN and code inputs are `dir="ltr"` with `text-end` in RTL.

## Tokens
`--input`, `--input-hover`, `--border-strong`, `--ring`, `--error`, `--error-bg`, `--muted-foreground`, `--control-h`, `--fs-ui`, `--radius-md`.
