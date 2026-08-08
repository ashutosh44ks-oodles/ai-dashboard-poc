import {
  type ColumnDef,
  type ColumnOrderState,
  type OnChangeFn,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useState, type DragEvent } from "react";
import { IconGripVertical } from "@tabler/icons-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DataTableToolbar } from "@/components/ui/data-table-toolbar";
import { cn } from "@/lib/utils";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  pagination: { pageIndex: number; pageSize: number };
  setPagination: React.Dispatch<
    React.SetStateAction<{
      pageIndex: number;
      pageSize: number;
    }>
  >;
  rowCount: number;
  sorting?: SortingState;
  onSortingChange?: OnChangeFn<SortingState>;
  globalFilter?: string;
  onGlobalFilterChange?: (value: string) => void;
  searchPlaceholder?: string;
  manualSorting?: boolean;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  pagination,
  setPagination,
  rowCount,
  sorting = [],
  onSortingChange,
  globalFilter = "",
  onGlobalFilterChange,
  searchPlaceholder,
  manualSorting = false,
}: DataTableProps<TData, TValue>) {
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>([]);
  const [draggedColumnId, setDraggedColumnId] = useState<string | null>(null);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting,
    onPaginationChange: setPagination,
    onSortingChange,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnOrderChange: setColumnOrder,
    rowCount,
    state: {
      pagination,
      sorting,
      columnVisibility,
      columnOrder,
    },
  });

  const handleDragStart = (
    event: DragEvent<HTMLButtonElement>,
    columnId: string
  ) => {
    setDraggedColumnId(columnId);
    event.dataTransfer.effectAllowed = "move";
  };

  const handleColumnDrop = (targetColumnId: string) => {
    if (!draggedColumnId || draggedColumnId === targetColumnId) return;

    const currentOrder =
      columnOrder.length > 0
        ? columnOrder
        : table.getAllLeafColumns().map((col) => col.id);

    const fromIndex = currentOrder.indexOf(draggedColumnId);
    const toIndex = currentOrder.indexOf(targetColumnId);
    if (fromIndex === -1 || toIndex === -1) return;

    const nextOrder = [...currentOrder];
    nextOrder.splice(fromIndex, 1);
    nextOrder.splice(toIndex, 0, draggedColumnId);
    setColumnOrder(nextOrder);
    setDraggedColumnId(null);
  };

  return (
    <div className="grid grid-cols-1">
      <DataTableToolbar
        table={table}
        globalFilter={globalFilter}
        onGlobalFilterChange={onGlobalFilterChange}
        searchPlaceholder={searchPlaceholder}
      />
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const canDrag = header.column.id !== "actions";

                  return (
                    <TableHead
                      key={header.id}
                      onDragOver={(event) => {
                        event.preventDefault();
                        event.dataTransfer.dropEffect = "move";
                      }}
                      onDrop={() => handleColumnDrop(header.column.id)}
                      className={cn(
                        draggedColumnId === header.column.id && "opacity-50"
                      )}
                    >
                      <div className="flex items-center gap-0.5">
                        {canDrag && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-7 shrink-0 cursor-grab shadow-none active:cursor-grabbing"
                            draggable
                            onDragStart={(event) =>
                              handleDragStart(event, header.column.id)
                            }
                            onDragEnd={() => setDraggedColumnId(null)}
                            aria-label="Drag to reorder"
                          >
                            <IconGripVertical
                              className="size-4 opacity-60"
                              aria-hidden="true"
                            />
                          </Button>
                        )}
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </div>
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
