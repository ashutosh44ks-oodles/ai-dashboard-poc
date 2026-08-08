import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import dataModels from "@/services/dataModels";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DeleteRecordDialogProps {
  tableName: string;
  tableLabel: string;
  record: Record<string, unknown> | null;
  pkColumn?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteRecordDialog({
  tableName,
  tableLabel,
  record,
  pkColumn,
  open,
  onOpenChange,
}: DeleteRecordDialogProps) {
  const queryClient = useQueryClient();
  const recordId =
    record && pkColumn ? String(record[pkColumn]) : undefined;

  const { mutate, isPending } = useMutation({
    mutationFn: () => {
      if (!recordId) throw new Error("Record ID not found");
      return dataModels.deleteRecord(tableName, recordId);
    },
    onSuccess: () => {
      toast.success("Record deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["tableData", tableName] });
      onOpenChange(false);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to delete record");
    },
  });

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete record?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete the record
            {pkColumn && recordId
              ? ` (${pkColumn}: ${recordId})`
              : ""}{" "}
            from {tableLabel}. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending || !recordId}
            onClick={(e) => {
              e.preventDefault();
              mutate();
            }}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
