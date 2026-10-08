"use client"

import { useTranslations } from "next-intl"

import { AttendanceHistory } from "./history"
import { TodayCard } from "./today-card"

export function AttendancePage() {
  const t = useTranslations("attendance")

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-h2 font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]">
        <TodayCard />
        <AttendanceHistory />
      </div>
    </div>
  )
}
