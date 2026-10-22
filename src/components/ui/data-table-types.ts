import type * as React from "react";

export interface DataTableColumn<TData> {
  id: string;
  header: React.ReactNode | ((context: { data: TData[] }) => React.ReactNode);
  accessorKey?: keyof TData;
  cell?: (item: TData, index: number) => React.ReactNode;
  className?: string;
  headerClassName?: string;
  align?: "left" | "center" | "right";
  sortable?: boolean;
}

export interface DataTablePaginationProps {
  pagination?: boolean;
  page?: number;
  defaultPage?: number;
  pageSize?: number;
  pageSizeOptions?: number[];
  totalCount?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  manualPagination?: boolean;
  showPageSizeSelector?: boolean;
  showTotalCount?: boolean;
}

export interface DataTableProps<TData> extends DataTablePaginationProps {
  data: TData[];
  columns: DataTableColumn<TData>[];
  getRowId?: (item: TData, index: number) => string | number;
  selectable?: boolean;
  selectedIds?: Set<string | number>;
  onSelectionChange?: (selectedIds: Set<string | number>, selectedItems: TData[]) => void;
  searchKey?: keyof TData;
  searchPlaceholder?: string;
  searchFilter?: (item: TData, query: string) => boolean;
  searchSlot?: React.ReactNode;
  headerSlot?: React.ReactNode;
  title?: React.ReactNode;
  description?: React.ReactNode;
  initialSortKey?: string;
  initialSortDirection?: "asc" | "desc";
  onRowClick?: (item: TData) => void;
  showRowChevron?: boolean;
  isLoading?: boolean;
  skeletonRowCount?: number;
  emptyMessage?: React.ReactNode;
  className?: string;
  tableClassName?: string;
  hideHeaderBorder?: boolean;
  variant?: "default" | "card" | "flush";
}
