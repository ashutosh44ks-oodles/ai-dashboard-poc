import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { IconLoader2 } from "@tabler/icons-react";
import dataModels from "@/services/dataModels";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  getInitialFormValue,
  isFormFieldReadonly,
  isFormFieldVisible,
  isTimestampType,
  parseFormFieldValue,
  type TableColumnConfig,
} from "@/lib/utils";

interface DataModelRecordSheetProps {
  tableName: string;
  tableLabel: string;
  mode: "add" | "edit";
  record?: Record<string, unknown> | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DataModelRecordSheet({
  tableName,
  tableLabel,
  mode,
  record,
  open,
  onOpenChange,
}: DataModelRecordSheetProps) {
  const queryClient = useQueryClient();
  const { data: tableConfig } = useQuery({
    queryKey: ["tableConfig", tableName],
    queryFn: () => dataModels.getTableConfig(tableName),
    enabled: !!tableName && open,
    staleTime: Infinity,
  });

  const columns = tableConfig?.data ?? [];
  const visibleColumns = useMemo(
    () => columns.filter((col) => isFormFieldVisible(col, mode)),
    [columns, mode]
  );

  const [formValues, setFormValues] = useState<Record<string, unknown>>({});

  useEffect(() => {
    if (!open) return;
    const initial: Record<string, unknown> = {};
    visibleColumns.forEach((col) => {
      initial[col.accessorKey] = getInitialFormValue(col, record);
    });
    setFormValues(initial);
  }, [open, mode, record, visibleColumns]);

  const { mutate, isPending } = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      if (mode === "add") {
        return dataModels.createRecord(tableName, payload);
      }
      const pkColumn = columns.find((c) => c.isPrimaryKey)?.accessorKey;
      if (!pkColumn || !record?.[pkColumn]) {
        throw new Error("Primary key not found for this record");
      }
      return dataModels.updateRecord(
        tableName,
        String(record[pkColumn]),
        payload
      );
    },
    onSuccess: () => {
      toast.success(
        mode === "add" ? "Record created successfully" : "Record updated successfully"
      );
      queryClient.invalidateQueries({ queryKey: ["tableData", tableName] });
      onOpenChange(false);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to save record");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Record<string, unknown> = {};
    visibleColumns.forEach((col) => {
      if (isFormFieldReadonly(col, mode)) return;
      payload[col.accessorKey] = parseFormFieldValue(
        col,
        formValues[col.accessorKey]
      );
    });
    mutate(payload);
  };

  const setFieldValue = (key: string, value: unknown) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 h-full">
          <SheetHeader>
            <SheetTitle>
              {mode === "add" ? "Add Record" : "Edit Record"}
            </SheetTitle>
            <SheetDescription>
              {mode === "add"
                ? `Create a new record in ${tableLabel}.`
                : `Update record in ${tableLabel}.`}
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-col gap-4 px-4">
            {visibleColumns.map((col) => (
              <FormField
                key={col.accessorKey}
                column={col}
                mode={mode}
                value={formValues[col.accessorKey]}
                onChange={(value) => setFieldValue(col.accessorKey, value)}
              />
            ))}
          </div>

          <SheetFooter className="px-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <IconLoader2 className="animate-spin" />}
              {mode === "add" ? "Create" : "Save"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function FormField({
  column,
  mode,
  value,
  onChange,
}: {
  column: TableColumnConfig;
  mode: "add" | "edit";
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  const readonly = isFormFieldReadonly(column, mode);
  const required =
    !readonly && !column.isNullable && !column.isAutoGenerated;

  if (column.sqlDataType === "boolean") {
    return (
      <div className="flex items-center gap-2">
        <Checkbox
          id={column.accessorKey}
          checked={Boolean(value)}
          disabled={readonly}
          onCheckedChange={(checked) => onChange(checked === true)}
        />
        <Label htmlFor={column.accessorKey}>{column.header}</Label>
      </div>
    );
  }

  if (column.sqlDataType === "text") {
    return (
      <div className="grid gap-2">
        <Label htmlFor={column.accessorKey}>{column.header}</Label>
        <Textarea
          id={column.accessorKey}
          value={String(value ?? "")}
          readOnly={readonly}
          required={required}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    );
  }

  const inputType =
    column.sqlDataType === "integer" || column.sqlDataType.includes("numeric")
      ? "number"
      : isTimestampType(column.sqlDataType)
        ? "datetime-local"
        : "text";

  return (
    <div className="grid gap-2">
      <Label htmlFor={column.accessorKey}>{column.header}</Label>
      <Input
        id={column.accessorKey}
        type={inputType}
        value={String(value ?? "")}
        readOnly={readonly}
        required={required}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
