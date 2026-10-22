"use client";

import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DataTablePaginationControlsProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  pageSizeOptions: number[];
  startItem: number;
  endItem: number;
  totalCount: number;
  showPageSizeSelector: boolean;
  showTotalCount: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export function DataTablePaginationControls({
  currentPage,
  totalPages,
  pageSize,
  pageSizeOptions,
  startItem,
  endItem,
  totalCount,
  showPageSizeSelector,
  showTotalCount,
  onPageChange,
  onPageSizeChange,
}: DataTablePaginationControlsProps) {
  return (
    <div className="flex flex-col gap-3 border-t border-border px-4 py-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        {showTotalCount ? (
          <p>
            <span className="font-medium text-foreground">{startItem}–{endItem}</span> of{" "}
            <span className="font-medium text-foreground">{totalCount}</span> entries
          </p>
        ) : null}

        {showPageSizeSelector ? (
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
              {pageSize} per page
              <ChevronDown data-icon="inline-end" aria-hidden="true" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-32">
              <DropdownMenuRadioGroup
                value={String(pageSize)}
                onValueChange={(value) => onPageSizeChange(Number(value))}
              >
                {pageSizeOptions.map((option) => (
                  <DropdownMenuRadioItem key={option} value={String(option)}>
                    {option} per page
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-2 sm:justify-end">
        <span className="mr-1 tabular-nums">Page {currentPage} of {totalPages}</span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
        >
          <ChevronLeft data-icon="inline-start" aria-hidden="true" />
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
        >
          Next
          <ChevronRight data-icon="inline-end" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
