# Pattern · Destructive confirm

Used for: Reject request, Decline cancellation, Withdraw request, Request cancellation, Deactivate employee (FE-05), Delete holiday/department (FE-04/05), Archive leave type, Discard unsaved changes, Remove session in a correction (FE-11).

**Not** used for: Approve (Undo instead), Mark all read, filters, or anything reversible with Undo.

## Anatomy (`AlertDialog`, 400px)
1. Optional 44px tinted icon circle (`--error-bg` / `--error`, `CircleX` or `TriangleAlert`).
2. **Title = the question, with the specific object:** "Reject Khalid's WFH request?" — not "Are you sure?".
3. Description = consequence + what the other person sees: "Thu 8 Oct. Khalid will be notified with your reason and can resubmit."
4. Optional required input (reason textarea, or a type-to-confirm field for Deactivate: type the employee's name).
5. Impact preview where relevant (FE-04 holiday: the list of affected approved requests; FE-05 deactivate: pending requests, future leave, direct reports to reassign, which must be completed inline before the confirm button enables).
6. Buttons: **safe action** (outline, e.g. "Keep pending") + **destructive action** (`variant="destructive"`, restating the outcome: "Reject request"). Order: safe at inline-start, destructive at inline-end. On mobile they stack, with the destructive one on top.

## Behaviour
- Initial focus goes to the **safe** action (or to the required input if there is one).
- Enter never triggers the destructive action. Esc and scrim clicks do not close an `alertdialog`; only the buttons do.
- The destructive button stays enabled. If the required input is empty, clicking it shows a field error (so screen-reader users discover why).
- While submitting: the button shows its loading state and both buttons are disabled. On error the dialog stays open with a section error.
- On success: close, return focus to the trigger (or the next logical element if the trigger is gone), toast with the outcome.

## Accessibility
`role="alertdialog"`, `aria-modal`, `aria-labelledby` = title, `aria-describedby` = description. Focus is trapped.

## Tokens
`--card`, `--border-strong`, `--elev-hard-lg`, `--radius-xl`, `--scrim`, `--destructive(-foreground)`, `--error(-bg)`, `--input`, `--ring`.
