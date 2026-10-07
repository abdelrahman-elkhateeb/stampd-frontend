import { nextJsConfig } from "@workspace/eslint-config/next-js"

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...nextJsConfig,
  {
    // Generated from api/contract.yaml by `pnpm api:generate`; never edited by hand.
    ignores: ["api/generated/**", "playwright-report/**", "test-results/**"],
  },
]
