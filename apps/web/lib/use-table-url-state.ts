"use client"

import {
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from "nuqs"
import { useMemo } from "react"

import { PAGE_SIZES, type PageSize } from "@workspace/ui/components/pagination"
import type { SortingState } from "@workspace/ui/components/data-table"

/**
 * Page, page size, sort and search for a server-side table, kept in the URL
 * (?page=2&size=25&sort=-joinedOn&q=omar) so a view can be bookmarked and shared.
 * Sort uses the API's convention: field name, "-" prefix for descending.
 */
export function useTableUrlState({
  defaultSort = "",
  defaultSize = 25 as PageSize,
} = {}) {
  const [state, setState] = useQueryStates(
    {
      page: parseAsInteger.withDefault(1),
      size: parseAsStringLiteral(
        PAGE_SIZES.map(String) as `${PageSize}`[]
      ).withDefault(String(defaultSize) as `${PageSize}`),
      sort: parseAsString.withDefault(defaultSort),
      q: parseAsString.withDefault(""),
    },
    { history: "replace", clearOnDefault: true }
  )

  const sorting: SortingState = useMemo(
    () =>
      state.sort
        ? [
            {
              id: state.sort.replace(/^-/, ""),
              desc: state.sort.startsWith("-"),
            },
          ]
        : [],
    [state.sort]
  )

  return {
    page: Math.max(state.page, 1),
    pageSize: Number(state.size) as PageSize,
    sort: state.sort,
    search: state.q,
    sorting,
    setPage: (page: number) => setState({ page }),
    // A new page size, sort or search starts again from page 1.
    setPageSize: (size: PageSize) =>
      setState({ size: String(size) as `${PageSize}`, page: 1 }),
    setSorting: (next: SortingState) => {
      const first = next[0]
      setState({
        sort: first ? `${first.desc ? "-" : ""}${first.id}` : null,
        page: 1,
      })
    },
    setSearch: (q: string) => setState({ q, page: 1 }),
  }
}
