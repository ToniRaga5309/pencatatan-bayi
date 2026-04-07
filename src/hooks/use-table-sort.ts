"use client"

// Reusable hook for table sorting with URL search params persistence
import { useCallback, useState } from "react"
import { useSearchParams } from "next/navigation"
import { useRouter, usePathname } from "next/navigation"

interface UseTableSortOptions {
  defaultField?: string
  defaultOrder?: "asc" | "desc"
}

export function useTableSort(options: UseTableSortOptions = {}) {
  const { defaultField = "createdAt", defaultOrder = "desc" } = options
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const sortField = searchParams.get("sortField") || defaultField
  const sortOrder = (searchParams.get("sortOrder") || defaultOrder) as "asc" | "desc"

  const handleSort = useCallback(
    (field: string) => {
      const params = new URLSearchParams(searchParams.toString())
      const newOrder = sortField === field && sortOrder === "asc" ? "desc" : "asc"
      params.set("sortField", field)
      params.set("sortOrder", newOrder)
      // Reset page to 1 when sorting
      params.set("page", "1")
      router.push(`${pathname}?${params.toString()}`)
    },
    [sortField, sortOrder, searchParams, router, pathname]
  )

  const isActiveSort = useCallback(
    (field: string) => sortField === field,
    [sortField]
  )

  const getSortIcon = useCallback(
    (field: string) => {
      if (sortField !== field) return "↑↓"
      return sortOrder === "asc" ? "↑" : "↓"
    },
    [sortField, sortOrder]
  )

  return {
    sortField,
    sortOrder,
    handleSort,
    isActiveSort,
    getSortIcon,
  }
}
