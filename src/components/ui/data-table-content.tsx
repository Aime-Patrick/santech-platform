"use client";

import type * as React from "react";
import { ChevronDown, ChevronRight, ChevronUp, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { DataTableColumn } from "@/components/ui/data-table-types";
import { cn } from "@/lib/utils";

interface DataTableContentProps<TData> {
  data: TData[];
  sourceData: TData[];
  columns: DataTableColumn<TData>[];
  getRowId: (item: TData, index: number) => string | number;
  selectable: boolean;
  selectedIds: Set<string | number>;
  allSelected: boolean;
  someSelected: boolean;
  onToggleAll: () => void;
  onToggleRow: (id: string | number, item: TData, event: React.MouseEvent) => void;
  sortKey?: string;
  sortDirection: "asc" | "desc";
  onSort: (columnId: string) => void;
  onRowClick?: (item: TData) => void;
  showRowChevron: boolean;
  isLoading: boolean;
  skeletonRowCount: number;
  emptyMessage: React.ReactNode;
  tableClassName?: string;
  hideHeaderBorder: boolean;
}

function alignmentClass(align?: "left" | "center" | "right") {
  if (align === "right") return "text-right";
  if (align === "center") return "text-center";
  return "text-left";
}

export function DataTableContent<TData>({
  data,
  sourceData,
  columns,
  getRowId,
  selectable,
  selectedIds,
  allSelected,
  someSelected,
  onToggleAll,
  onToggleRow,
  sortKey,
  sortDirection,
  onSort,
  onRowClick,
  showRowChevron,
  isLoading,
  skeletonRowCount,
  emptyMessage,
  tableClassName,
  hideHeaderBorder,
}: DataTableContentProps<TData>) {
  const columnSpan = columns.length + (selectable ? 1 : 0) + (showRowChevron ? 1 : 0);

  return (
    <Table className={cn("min-w-full", tableClassName)}>
      <TableHeader className="bg-muted/35">
        <TableRow className={cn("hover:bg-transparent", hideHeaderBorder && "border-transparent")}>
          {selectable ? (
            <TableHead className="w-12 px-4">
              <Checkbox
                checked={allSelected}
                indeterminate={someSelected}
                onCheckedChange={onToggleAll}
                aria-label="Select all rows"
              />
            </TableHead>
          ) : null}

          {columns.map((column) => (
            <TableHead
              key={column.id}
              className={cn(
                "h-10 px-4 text-xs font-medium text-muted-foreground",
                alignmentClass(column.align),
                column.headerClassName
              )}
            >
              {column.sortable ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onSort(column.id)}
                  className="-ml-2 text-muted-foreground hover:text-foreground"
                >
                  {typeof column.header === "function" ? column.header({ data: sourceData }) : column.header}
                  {sortKey === column.id ? (
                    sortDirection === "asc" ? <ChevronUp aria-hidden="true" /> : <ChevronDown aria-hidden="true" />
                  ) : (
                    <ChevronsUpDown aria-hidden="true" className="opacity-45" />
                  )}
                </Button>
              ) : typeof column.header === "function" ? (
                column.header({ data: sourceData })
              ) : (
                column.header
              )}
            </TableHead>
          ))}

          {showRowChevron ? <TableHead className="w-12 px-4"><span className="sr-only">Open</span></TableHead> : null}
        </TableRow>
      </TableHeader>

      <TableBody>
        {isLoading ? (
          Array.from({ length: skeletonRowCount }).map((_, rowIndex) => (
            <TableRow key={`skeleton-${rowIndex}`}>
              {selectable ? <TableCell className="px-4 py-3"><Skeleton className="size-4" /></TableCell> : null}
              {columns.map((column) => (
                <TableCell key={`skeleton-${column.id}`} className="px-4 py-3.5">
                  <Skeleton className="h-4 w-3/4" />
                </TableCell>
              ))}
              {showRowChevron ? <TableCell className="px-4 py-3"><Skeleton className="size-4" /></TableCell> : null}
            </TableRow>
          ))
        ) : data.length === 0 ? (
          <TableRow className="hover:bg-transparent">
            <TableCell colSpan={columnSpan} className="h-32 text-center text-sm text-muted-foreground">
              {emptyMessage}
            </TableCell>
          </TableRow>
        ) : (
          data.map((item, rowIndex) => {
            const rowId = getRowId(item, rowIndex);
            const isSelected = selectedIds.has(rowId);
            const openRow = () => onRowClick?.(item);

            return (
              <TableRow
                key={rowId}
                tabIndex={onRowClick ? 0 : undefined}
                onClick={openRow}
                onKeyDown={(event) => {
                  if (onRowClick && (event.key === "Enter" || event.key === " ")) {
                    event.preventDefault();
                    openRow();
                  }
                }}
                data-state={isSelected ? "selected" : undefined}
                className={cn(
                  "border-border/70 hover:bg-muted/30 focus-visible:bg-muted/30 focus-visible:outline-none",
                  onRowClick && "cursor-pointer"
                )}
              >
                {selectable ? (
                  <TableCell className="w-12 px-4 py-3.5">
                    <Checkbox
                      checked={isSelected}
                      onClick={(event) => onToggleRow(rowId, item, event)}
                      aria-label={`Select row ${rowId}`}
                    />
                  </TableCell>
                ) : null}

                {columns.map((column) => {
                  const content = column.cell
                    ? column.cell(item, rowIndex)
                    : column.accessorKey
                      ? (item[column.accessorKey] as React.ReactNode)
                      : null;

                  return (
                    <TableCell
                      key={column.id}
                      className={cn(
                        "px-4 py-3.5 text-[13px] text-foreground",
                        alignmentClass(column.align),
                        column.className
                      )}
                    >
                      {content}
                    </TableCell>
                  );
                })}

                {showRowChevron ? (
                  <TableCell className="w-12 px-4 py-3.5 text-right text-muted-foreground">
                    <ChevronRight aria-hidden="true" className="ml-auto size-4" />
                  </TableCell>
                ) : null}
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
}
