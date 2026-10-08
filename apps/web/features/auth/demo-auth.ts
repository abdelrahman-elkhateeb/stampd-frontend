// ponytail: stands in for the auth API (BE-02) so every screen and error can be seen.
// Any @demo.stampd.app email logs in with any password; two addresses show the error states.

const DEMO_DOMAIN = "@demo.stampd.app"

export type LoginResult = "ok" | "incorrect" | "deactivated" | "locked"

export function demoLogin(email: string): LoginResult {
  const address = email.trim().toLowerCase()
  if (address === `deactivated${DEMO_DOMAIN}`) return "deactivated"
  if (address === `locked${DEMO_DOMAIN}`) return "locked"
  return address.endsWith(DEMO_DOMAIN) ? "ok" : "incorrect"
}

/** Signup: demo addresses count as already registered. */
export function isRegistered(email: string) {
  return email.trim().toLowerCase().endsWith(DEMO_DOMAIN)
}

/** Invite and reset links with the token "expired" show the expired state. */
export function findInvite(token: string) {
  return token === "expired"
    ? null
    : {
        company: "Nakheel Trading",
        name: "Omar Al-Qahtani",
        email: "omar@demo.stampd.app",
      }
}

export function isResetTokenValid(token: string) {
  return token !== "expired"
}

/** Only same-site paths, so a crafted link can't send people elsewhere after login. */
export function safeReturnTo(value: string | string[] | undefined) {
  return typeof value === "string" &&
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !value.startsWith("/\\")
    ? value
    : "/"
}
