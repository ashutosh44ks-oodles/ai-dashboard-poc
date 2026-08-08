import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { DataModelRecordSheet } from "@/components/data-model-record-sheet";
import { DeleteRecordDialog } from "@/components/delete-record-dialog";
import { formatBackendColumnDefToFrontend } from "@/lib/utils";
import dataModels from "@/services/dataModels";
import { IconAlertCircle, IconPencil, IconPlus, IconTrash } from "@tabler/icons-react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router";

const TabularInteraction = () => {
  const { tableName } = useParams();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState<"add" | "edit">("add");
  const [editingRecord, setEditingRecord] = useState<Record<string, unknown> | null>(
    null
  );
  const [deleteTarget, setDeleteTarget] = useState<Record<string, unknown> | null>(
    null
  );
  const [deleteOpen, setDeleteOpen] = useState(false);

  const {
    data: tableConfigRaw,
    error: tableConfigError,
    isError: tableConfigHasError,
  } = useQuery({
    queryKey: ["tableConfig", tableName],
    queryFn: () => dataModels.getTableConfig(tableName),
    enabled: !!tableName,
    staleTime: Infinity,
  });

  const { data: dbTables } = useQuery({
    queryKey: ["dbTables"],
    queryFn: dataModels.getDBTables,
    staleTime: Infinity,
  });

  const tableLabel = useMemo(() => {
    const table = (dbTables?.data || []).find((t) => t.value === tableName);
    return table?.label || tableName;
  }, [dbTables, tableName]);

  const pkColumn = useMemo(
    () => tableConfigRaw?.data?.find((col) => col.isPrimaryKey)?.accessorKey,
    [tableConfigRaw]
  );

  const displayColumns = useMemo(() => {
    const formatted = tableConfigRaw
      ? formatBackendColumnDefToFrontend(tableConfigRaw)
      : null;
    if (!formatted?.data) return [];

    const actionsColumn: ColumnDef<unknown> = {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => {
              setSheetMode("edit");
              setEditingRecord(row.original as Record<string, unknown>);
              setSheetOpen(true);
            }}
          >
            <IconPencil className="size-4" />
            <span className="sr-only">Edit</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => {
              setDeleteTarget(row.original as Record<string, unknown>);
              setDeleteOpen(true);
            }}
          >
            <IconTrash className="size-4" />
            <span className="sr-only">Delete</span>
          </Button>
        </div>
      ),
    };

    return [...formatted.data, actionsColumn];
  }, [tableConfigRaw]);

  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const { data: tableData } = useQuery({
    queryKey: ["tableData", tableName, pagination.pageIndex],
    queryFn: () => dataModels.getTableData(tableName, pagination.pageIndex),
    enabled: !!tableName,
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [tableName]);

  const openAddSheet = () => {
    setSheetMode("add");
    setEditingRecord(null);
    setSheetOpen(true);
  };

  if (!tableName)
    return (
      <h3 className="text-xl mb-4">
        Error fetching details for: "{tableLabel}"
      </h3>
    );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl">Now Showing: "{tableLabel}"</h3>
        <Button variant="outline" size="md" onClick={openAddSheet}>
          <IconPlus className="size-4" />
          Add Record
        </Button>
      </div>

      {tableConfigHasError && (
        <Alert variant="destructive">
          <IconAlertCircle />
          <AlertTitle>Failed to fetch table configuration</AlertTitle>
          <AlertDescription>{tableConfigError.message}</AlertDescription>
        </Alert>
      )}

      {displayColumns.length > 0 && tableData?.data && (
        <DataTable
          columns={displayColumns}
          data={tableData.data?.content}
          pagination={pagination}
          setPagination={setPagination}
          rowCount={tableData.data?.totalElements}
        />
      )}

      <DataModelRecordSheet
        tableName={tableName}
        tableLabel={tableLabel ?? tableName}
        mode={sheetMode}
        record={editingRecord}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />

      <DeleteRecordDialog
        tableName={tableName}
        tableLabel={tableLabel ?? tableName}
        record={deleteTarget}
        pkColumn={pkColumn}
        open={deleteOpen}
        onOpenChange={(open) => {
          setDeleteOpen(open);
          if (!open) setDeleteTarget(null);
        }}
      />
    </div>
  );
};

export default TabularInteraction;
