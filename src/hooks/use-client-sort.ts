"use client"

// Reusable hook for client-side table sorting (no URL params)
import { useState, useCallback, useMemo } from "react"

interface UseClientSortOptions<T> {
  data: T[]
  defaultField?: string
  defaultOrder?: "asc" | "desc"
}

export function useClientSort<T extends Record<string, unknown>>({
  data,
  defaultField = "createdAt",
  defaultOrder = "desc",
}: UseClientSortOptions<T>) {
  const [sortField, setSortField] = useState(defaultField)
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">(defaultOrder)

  const handleSort = useCallback((field: string) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
    } else {
      setSortField(field)
      setSortOrder("asc")
    }
  }, [sortField])

  const sortedData = useMemo(() => {
    if (!data || data.length === 0) return data

    return [...data].sort((a, b) => {
      const aVal = a[sortField]
      const bVal = b[sortField]

      // Handle null/undefined
      if (aVal == null && bVal == null) return 0
      if (aVal == null) return 1
      if (bVal == null) return -1

      let comparison = 0

      if (typeof aVal === "string" && typeof bVal === "string") {
        comparison = aVal.localeCompare(bVal)
      } else if (typeof aVal === "number" && typeof bVal === "number") {
        comparison = aVal - bVal
      } else if (aVal instanceof Date && bVal instanceof Date) {
        comparison = aVal.getTime() - bVal.getTime()
      } else {
        comparison = String(aVal).localeCompare(String(bVal))
      }

      return sortOrder === "asc" ? comparison : -comparison
    })
  }, [data, sortField, sortOrder])

  return {
    sortField,
    sortOrder,
    handleSort,
    sortedData,
  }
}
