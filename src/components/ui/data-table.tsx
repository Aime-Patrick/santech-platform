"use client";

import * as React from "react";
import { DataTableContent } from "@/components/ui/data-table-content";
import { DataTablePaginationControls } from "@/components/ui/data-table-pagination";
import { DataTableToolbar } from "@/components/ui/data-table-toolbar";
import type { DataTableProps } from "@/components/ui/data-table-types";
import { cn } from "@/lib/utils";

export type {
  DataTableColumn,
  DataTablePaginationProps,
  DataTableProps,
} from "@/components/ui/data-table-types";

export function DataTable<TData>({
  data,
  columns,
  getRowId = (_, index) => index,
  selectable = false,
  selectedIds: controlledSelectedIds,
  onSelectionChange,
  searchKey,
  searchPlaceholder = "Search records...",
  searchFilter,
  searchSlot,
  headerSlot,
  title,
  description,
  initialSortKey,
  initialSortDirection = "asc",
  pagination = false,
  page: controlledPage,
  defaultPage = 1,
  pageSize: controlledPageSize,
  pageSizeOptions = [5, 10, 20, 50],
  totalCount: controlledTotalCount,
  onPageChange,
  onPageSizeChange,
  manualPagination = false,
  showPageSizeSelector,
  showTotalCount = true,
  onRowClick,
  showRowChevron = Boolean(onRowClick),
  isLoading = false,
  skeletonRowCount = 5,
  emptyMessage = "No records found.",
  className,
  tableClassName,
  hideHeaderBorder = false,
  variant = "default",
}: DataTableProps<TData>) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [sortKey, setSortKey] = React.useState<string | undefined>(initialSortKey);
  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">(initialSortDirection);
  const [internalSelectedIds, setInternalSelectedIds] = React.useState<Set<string | number>>(new Set());
  const [internalPage, setInternalPage] = React.useState(defaultPage);
  const [internalPageSize, setInternalPageSize] = React.useState(controlledPageSize ?? 10);

  const selectedIds = controlledSelectedIds ?? internalSelectedIds;
  const currentPage = controlledPage ?? internalPage;
  const activePageSize = controlledPageSize ?? internalPageSize;

  const filteredData = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return data;
    if (searchFilter) return data.filter((item) => searchFilter(item, query));
    if (searchKey) {
      return data.filter((item) => String(item[searchKey] ?? "").toLowerCase().includes(query));
    }
    return data.filter((item) =>
      columns.some((column) =>
        column.accessorKey
          ? String(item[column.accessorKey] ?? "").toLowerCase().includes(query)
          : false
      )
    );
  }, [columns, data, searchFilter, searchKey, searchQuery]);

  const sortedData = React.useMemo(() => {
    if (!sortKey) return filteredData;
    const column = columns.find((candidate) => candidate.id === sortKey);
    if (!column?.accessorKey) return filteredData;

    return [...filteredData].sort((left, right) => {
      const leftValue = left[column.accessorKey!];
      const rightValue = right[column.accessorKey!];
      if (leftValue === rightValue) return 0;
      if (leftValue == null) return 1;
      if (rightValue == null) return -1;
      const comparison = leftValue < rightValue ? -1 : 1;
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [columns, filteredData, sortDirection, sortKey]);

  const effectiveTotalCount = controlledTotalCount ?? sortedData.length;
  const totalPages = Math.max(1, Math.ceil(effectiveTotalCount / activePageSize));
  const visibleData = React.useMemo(() => {
    if (!pagination || manualPagination) return sortedData;
    const start = (currentPage - 1) * activePageSize;
    return sortedData.slice(start, start + activePageSize);
  }, [activePageSize, currentPage, manualPagination, pagination, sortedData]);

  const visibleIds = React.useMemo(
    () => visibleData.map((item, index) => getRowId(item, index)),
    [getRowId, visibleData]
  );
  const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));
  const someSelected = visibleIds.some((id) => selectedIds.has(id)) && !allSelected;

  const changePage = (page: number) => {
    const nextPage = Math.max(1, Math.min(page, totalPages));
    if (controlledPage === undefined) setInternalPage(nextPage);
    onPageChange?.(nextPage);
  };

  const changePageSize = (pageSize: number) => {
    if (controlledPageSize === undefined) setInternalPageSize(pageSize);
    onPageSizeChange?.(pageSize);
    changePage(1);
  };

  const updateSelection = (next: Set<string | number>) => {
    if (!controlledSelectedIds) setInternalSelectedIds(next);
    onSelectionChange?.(next, data.filter((item, index) => next.has(getRowId(item, index))));
  };

  const toggleAll = () => {
    const next = new Set(selectedIds);
    visibleIds.forEach((id) => allSelected ? next.delete(id) : next.add(id));
    updateSelection(next);
  };

  const toggleRow = (id: string | number, _item: TData, event: React.MouseEvent) => {
    event.stopPropagation();
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    updateSelection(next);
  };

  const toggleSort = (columnId: string) => {
    if (sortKey === columnId) setSortDirection((current) => current === "asc" ? "desc" : "asc");
    else {
      setSortKey(columnId);
      setSortDirection("asc");
    }
  };

  const hasToolbar = Boolean(title || description || searchKey || searchSlot || headerSlot);
  const startItem = effectiveTotalCount === 0 ? 0 : (currentPage - 1) * activePageSize + 1;
  const endItem = Math.min(currentPage * activePageSize, effectiveTotalCount);

  return (
    <div
      className={cn(
        "w-full overflow-hidden",
        variant === "card" && "rounded-xl border border-border bg-card shadow-xs",
        variant === "flush" && "border-0",
        className
      )}
    >
      {hasToolbar ? (
        <DataTableToolbar
          title={title}
          description={description}
          searchEnabled={Boolean(searchKey)}
          searchQuery={searchQuery}
          searchPlaceholder={searchPlaceholder}
          onSearchChange={(value) => {
            setSearchQuery(value);
            changePage(1);
          }}
          searchSlot={searchSlot}
          headerSlot={headerSlot}
        />
      ) : null}

      <DataTableContent
        data={visibleData}
        sourceData={data}
        columns={columns}
        getRowId={getRowId}
        selectable={selectable}
        selectedIds={selectedIds}
        allSelected={allSelected}
        someSelected={someSelected}
        onToggleAll={toggleAll}
        onToggleRow={toggleRow}
        sortKey={sortKey}
        sortDirection={sortDirection}
        onSort={toggleSort}
        onRowClick={onRowClick}
        showRowChevron={showRowChevron}
        isLoading={isLoading}
        skeletonRowCount={skeletonRowCount}
        emptyMessage={emptyMessage}
        tableClassName={tableClassName}
        hideHeaderBorder={hideHeaderBorder}
      />

      {pagination ? (
        <DataTablePaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={activePageSize}
          pageSizeOptions={pageSizeOptions}
          startItem={startItem}
          endItem={endItem}
          totalCount={effectiveTotalCount}
          showPageSizeSelector={showPageSizeSelector ?? pageSizeOptions.length > 0}
          showTotalCount={showTotalCount}
          onPageChange={changePage}
          onPageSizeChange={changePageSize}
        />
      ) : null}
    </div>
  );
}
