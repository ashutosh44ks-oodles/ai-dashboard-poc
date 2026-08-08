import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { APIResponse } from "@/lib/constants";
import type { ColumnDef } from "@tanstack/react-table";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const scrollToBottom = () => {
  window.scrollTo({
    top: document.body.scrollHeight,
    behavior: "smooth",
  });
};

interface BackendColumnDef {
  header: string;
  accessorKey: string;
  sqlDataType: string;
}
export const formatBackendColumnDefToFrontend = (
  data: APIResponse<ColumnDef<unknown>[]>
): APIResponse<ColumnDef<unknown>[]> => {
  if (!data.success) return data;
  if (!data?.data) return data;
  const backendColumns = data.data as BackendColumnDef[];
  return {
    ...data,
    data: backendColumns.map((col) => ({
      header: col.header,
      accessorKey: col.accessorKey,
      cell: (info) => {
        const value = info.getValue();
        if (col.sqlDataType === "timestamp with time zone" && value) {
          const date = new Date(value as string);
          if (!isNaN(date.getTime())) {
            return date.toLocaleString();
          }
        }
        return value;
      },
    })),
  };
};
