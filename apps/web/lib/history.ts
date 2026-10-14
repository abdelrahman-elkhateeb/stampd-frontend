import { api } from "@/lib/api"

/** One change to a record (BE-04), newest first; `fields` lists what changed. */
export type Change = {
  id: string
  action: string
  at: string
  /** null for the system. */
  actor: string | null
  source: "USER" | "APPROVAL" | "SYSTEM_JOB"
  oldValues: Record<string, unknown>
  newValues: Record<string, unknown>
  fields: { field: string; from: unknown; to: unknown }[]
  reason: string | null
}

type ApiChange = Omit<
  Change,
  "actor" | "fields" | "oldValues" | "newValues"
> & {
  actor: { type: "USER"; name?: string | null } | { type: "SYSTEM" }
  oldValues: Record<string, unknown> | null
  newValues: Record<string, unknown> | null
}

/** GET /history/{recordType}/{id}. ponytail: the latest 100 changes; page when someone needs older ones. */
export async function getHistory(
  recordType:
    | "attendance-days"
    | "leave-balances"
    | "requests"
    | "employees"
    | "company-settings",
  id: string
): Promise<Change[]> {
  const { items } = await api<{ items: ApiChange[] }>(
    `/history/${recordType}/${id}?pageSize=100`
  )
  return items.map(({ actor, oldValues, newValues, ...entry }) => ({
    ...entry,
    actor: actor.type === "USER" ? (actor.name ?? null) : null,
    oldValues: oldValues ?? {},
    newValues: newValues ?? {},
    fields: Object.keys(newValues ?? {}).map((field) => ({
      field,
      from: oldValues?.[field],
      to: newValues?.[field],
    })),
  }))
}
