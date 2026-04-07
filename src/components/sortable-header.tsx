"use client"

// Reusable sortable table header component with visual feedback
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { TableHead } from "@/components/ui/table"
import { cn } from "@/lib/utils"

interface SortableHeaderProps {
  label: string
  sortField: string
  currentSortField: string
  sortOrder: "asc" | "desc"
  onSort: (field: string) => void
  className?: string
}

export function SortableHeader({
  label,
  sortField,
  currentSortField,
  sortOrder,
  onSort,
  className,
}: SortableHeaderProps) {
  const isActive = sortField === currentSortField

  return (
    <TableHead
      className={cn(
        "cursor-pointer select-none hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors",
        isActive && "bg-emerald-50/50 dark:bg-emerald-900/10 text-emerald-700 dark:text-emerald-300",
        className
      )}
      onClick={() => onSort(sortField)}
    >
      <span className="inline-flex items-center gap-1.5">
        {label}
        {isActive ? (
          sortOrder === "asc" ? (
            <ArrowUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <ArrowDown className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          )
        ) : (
          <ArrowUpDown className="w-3.5 h-3.5 opacity-40" />
        )}
      </span>
    </TableHead>
  )
}
