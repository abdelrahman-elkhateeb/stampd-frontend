import { defineConfig } from "orval"

const input = { target: "./api/contract.yaml" }

export default defineConfig({
  // Browser: TanStack Query hooks that call our own /api/* proxy (the BFF), plus MSW mocks.
  query: {
    input,
    output: {
      target: "./api/generated/query",
      schemas: "./api/generated/model",
      mode: "tags-split",
      client: "react-query",
      httpClient: "fetch",
      clean: true,
      override: {
        mutator: { path: "./lib/api/browser-fetch.ts", name: "browserFetch" },
        // The mutators resolve with the body and throw ApiError otherwise.
        fetch: { includeHttpResponseReturnType: false },
        query: { useQuery: true, useSuspenseQuery: true },
      },
      mock: {
        indexMockFiles: true,
        generators: [{ type: "msw", useExamples: true, delay: false }],
      },
    },
  },
  // Server: plain functions for Server Components, Server Actions and Route Handlers.
  server: {
    input,
    output: {
      target: "./api/generated/server",
      schemas: "./api/generated/model",
      mode: "tags-split",
      client: "fetch",
      clean: true,
      override: {
        mutator: { path: "./lib/api/server-fetch.ts", name: "serverFetch" },
        fetch: { includeHttpResponseReturnType: false },
      },
    },
  },
  // Zod schemas to validate responses and share form rules with the API.
  zod: {
    input,
    output: {
      target: "./api/generated/zod",
      mode: "tags-split",
      client: "zod",
      clean: true,
    },
  },
})
