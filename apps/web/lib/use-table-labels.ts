"use client"

import { useLocale, useTranslations } from "next-intl"
import { useMemo } from "react"

import { formatNumber } from "@/lib/format"
import type { TablePaginationLabels } from "@workspace/ui/components/pagination"

/** Translated labels and number formatting for DataTable + TablePagination. */
export function useTableLabels() {
  const t = useTranslations()
  const locale = useLocale()

  return useMemo(() => {
    const number = (value: number) => formatNumber(value, locale)
    const pagination: TablePaginationLabels = {
      nav: t("pagination.nav"),
      previous: t("pagination.previous"),
      next: t("pagination.next"),
      page: (page) => t("pagination.page", { page: number(page) }),
      range: (from, to, total) =>
        t("pagination.range", {
          from: number(from),
          to: number(to),
          total: number(total),
        }),
      pageOf: (page, count) =>
        t("pagination.pageOf", { page: number(page), count: number(count) }),
      rowsPerPage: t("pagination.rowsPerPage"),
    }
    return {
      formatNumber: number,
      pagination,
      sort: {
        ascending: t("table.sortedAscending"),
        descending: t("table.sortedDescending"),
        none: t("table.notSorted"),
      },
      loading: (thing: string) => t("table.loading", { thing }),
    }
  }, [t, locale])
}
