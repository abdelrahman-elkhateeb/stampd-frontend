/**
 * Mock Stampd API for local development, CI and Playwright.
 * Serves the MSW handlers over real HTTP, so the Next.js server talks to it exactly
 * like it will talk to the backend. Run with `pnpm mock` (port from API_BASE_URL).
 */
import { createServer } from "node:http"
import { getResponse } from "msw"

import { handlers } from "./handlers"

const port = Number(
  new URL(process.env.API_BASE_URL ?? "http://localhost:4000").port || 4000
)

const server = createServer(async (req, res) => {
  const chunks: Buffer[] = []
  for await (const chunk of req) chunks.push(chunk as Buffer)

  const headers = new Headers()
  for (const [name, value] of Object.entries(req.headers)) {
    if (value !== undefined)
      headers.set(name, Array.isArray(value) ? value.join(", ") : value)
  }
  const hasBody =
    req.method !== "GET" && req.method !== "HEAD" && chunks.length > 0
  const request = new Request(
    new URL(req.url ?? "/", `http://localhost:${port}`),
    {
      method: req.method,
      headers,
      body: hasBody ? Buffer.concat(chunks) : undefined,
    }
  )

  const response =
    (await getResponse(handlers, request)) ??
    Response.json(
      { code: "NOT_FOUND", message: `No mock for ${req.method} ${req.url}` },
      { status: 404 }
    )

  const outHeaders = Object.fromEntries(response.headers)
  const requestId = req.headers["x-request-id"]
  if (requestId && !outHeaders["x-request-id"])
    outHeaders["x-request-id"] = String(requestId)

  res.writeHead(response.status, outHeaders)
  res.end(Buffer.from(await response.arrayBuffer()))
  console.log(`${req.method} ${req.url} -> ${response.status}`)
})

server.listen(port, () => {
  console.log(`Mock API listening on http://localhost:${port}`)
})
