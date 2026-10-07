import react from "@vitejs/plugin-react"
import { defineConfig } from "vitest/config"

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Same @/* and @workspace/ui/* aliases as tsconfig.json.
    tsconfigPaths: true,
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["**/*.test.{ts,tsx}"],
    exclude: ["node_modules/**", "e2e/**", ".next/**"],
    // Business dates must never depend on the machine's timezone.
    env: { TZ: "America/Los_Angeles" },
  },
})
