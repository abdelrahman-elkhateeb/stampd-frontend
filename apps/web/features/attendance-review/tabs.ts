export const TABS = ["day", "month", "exceptions", "corrections"] as const
export type Tab = (typeof TABS)[number]
