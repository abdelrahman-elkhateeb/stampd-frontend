# Password field · v0.4

**Purpose.** Set or enter a password (FE-02: signup, accept invite, reset, change password in profile, per FE-03).

**Anatomy.** Label · input (dots, `font-size` 18, tracking 0.2em) + show/hide icon button (`Eye` / `EyeOff`) at inline-end · strength meter (4 ink bars) + strength word + "n of 4" · rule checklist (check / empty circle per rule).

**Variants.** `new` (meter + rules, `autocomplete="new-password"`) · `current` (login: no meter, `autocomplete="current-password"`, link "Forgot password?" under it) · `confirm` (matches the first field; error "Passwords don't match").

**Strength.** zxcvbn score 0–4 → Too weak / Weak / Fair / Good / Strong, shown as filled ink bars (1–4) with the rest outlined. It never uses a red-to-green colour scale. The meter is a **hint**: only the server rules block submission (FE-02).

**Rules (server, shown live).** At least 10 characters · not a common password · doesn't contain your name or email. Met = `--success` check + text; unmet = `--muted-foreground` circle. They are shown on focus and remain while unmet.

**States.** As Input, plus the toggle states: shown (`EyeOff`, `aria-pressed="true"`, type=text) and hidden.

**Behaviour.** Never auto-hide while typing. Paste is allowed. Caps Lock on shows the warning "Caps Lock is on" under the field. Login errors use the generic message "Email or password is incorrect" (FE-02 AC: no account enumeration).

**Accessibility.** The toggle is a button labelled "Show password" / "Hide password". The strength word is in a polite live region, announced at most once per second. The rules list is linked with `aria-describedby`.

**RTL.** The input content stays LTR (`dir="ltr"`) and the toggle sits at inline-end.

**Props.**
```ts
interface PasswordFieldProps { label: string; variant: 'new' | 'current' | 'confirm'; value: string; onChange: (v: string) => void; userInputs?: string[] /* name, email for zxcvbn */; matchValue?: string; error?: string; forgotHref?: string; }
```

**Tokens.** As Input + `--foreground` (bars), `--muted`, `--input`, `--success`, `--muted-foreground`, `--warning`.
