"use client";

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type Row,
} from "@tanstack/react-table";
import type { ReactNode, UIEvent } from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/data-display/EmptyState";

export interface DataTableProps<TData> {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  isLoading?: boolean;
  error?: Error | null;
  emptyMessage?: string;
  loadingMessage?: string;
  stickyHeader?: boolean;
  scrollContainerClassName?: string;
  tableClassName?: string;
  getRowClassName?: (row: Row<TData>) => string | undefined;
  onScroll?: (event: UIEvent<HTMLDivElement>) => void;
  footer?: ReactNode;
  toolbar?: ReactNode;
}

export function DataTable<TData>({
  columns,
  data,
  isLoading = false,
  error = null,
  emptyMessage = "No se encontraron registros.",
  stickyHeader = false,
  scrollContainerClassName,
  tableClassName,
  getRowClassName,
  onScroll,
  footer,
  toolbar,
}: DataTableProps<TData>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const colSpan = columns.length;

  if (error) {
    return (
      <div className="surface-panel overflow-hidden">
        {toolbar ? (
          <div className="border-b border-border bg-card p-4">{toolbar}</div>
        ) : null}
        <div className="p-8 text-center text-sm text-destructive">
          {error.message || "Error al cargar los datos."}
        </div>
      </div>
    );
  }

  return (
    <div className="surface-panel overflow-hidden">
      {toolbar ? (
        <div className="border-b border-border bg-card p-4">{toolbar}</div>
      ) : null}

      <div className={cn("overflow-x-auto", scrollContainerClassName)} onScroll={onScroll}>
        <table
          className={cn(
            "w-full border-collapse text-left text-sm text-muted-foreground",
            tableClassName
          )}
        >
          <thead
            className={cn(
              "border-b border-border bg-muted/50 text-xs font-semibold tracking-wide text-foreground uppercase",
              stickyHeader && "sticky top-0 z-10"
            )}
          >
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    scope="col"
                    className={cn(
                      "whitespace-nowrap px-4 py-3.5",
                      stickyHeader && "sticky top-0 z-10 bg-muted/95 backdrop-blur-sm",
                      header.column.id === "actions" && "text-right"
                    )}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-border bg-card">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <tr key={`skeleton-${index}`}>
                  {columns.map((column, colIndex) => (
                    <td key={`${index}-${colIndex}`} className="px-4 py-3">
                      <Skeleton className="h-5 w-full max-w-[12rem]" />
                    </td>
                  ))}
                </tr>
              ))
            ) : table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={colSpan} className="p-0">
                  <EmptyState description={emptyMessage} />
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className={cn(
                    "transition-colors duration-150 hover:bg-muted/40",
                    getRowClassName?.(row)
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className={cn(
                        "whitespace-nowrap px-4 py-3.5 text-foreground",
                        cell.column.id === "actions" && "text-right"
                      )}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!isLoading && footer ? (
        <div className="border-t border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          {footer}
        </div>
      ) : null}
    </div>
  );
}
