import type { CustomMessage } from "@/hooks/DataModelContext";
import api from "@/lib/api";
import type { APIResponse, ApiResponsePageable } from "@/lib/constants";
import type { TableColumnConfig } from "@/lib/utils";

const saveRecord = async (formData: FormData) => {
  const response = await api.post(`/ai/save-record`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

const saveRecordRecursively = async ({
  prompt,
  history,
}: {
  prompt: string;
  history: CustomMessage[];
}) => {
  const response = await api.post(`/ai/bulk-save-record`, { prompt, history });
  return response.data;
};

const getDBTables = async (): Promise<
  APIResponse<
    {
      label: string;
      value: string;
    }[]
  >
> => {
  const response = await api.get(`/data-models`);
  return response.data;
};

const getTableConfig = async (
  tableName: string | undefined
): Promise<APIResponse<TableColumnConfig[]>> => {
  if (!tableName) throw new Error("Table name is required");
  const response = await api.get(`/data-models/${tableName}/config`);
  return response.data;
};

const getTableData = async (
  tableName: string | undefined,
  page?: number
): Promise<ApiResponsePageable<unknown>> => {
  if (!tableName) throw new Error("Table name is required");
  const response = await api.get(`/data-models/${tableName}/data`, {
    params: {
      page: page ?? 0,
    },
  });
  return response.data;
};

const createRecord = async (
  tableName: string,
  data: Record<string, unknown>
): Promise<APIResponse<Record<string, unknown>>> => {
  const response = await api.post(`/data-models/${tableName}/records`, data);
  return response.data;
};

const updateRecord = async (
  tableName: string,
  recordId: string,
  data: Record<string, unknown>
): Promise<APIResponse<Record<string, unknown>>> => {
  const response = await api.put(
    `/data-models/${tableName}/records/${recordId}`,
    data
  );
  return response.data;
};

const deleteRecord = async (
  tableName: string,
  recordId: string
): Promise<APIResponse<Record<string, unknown>>> => {
  const response = await api.delete(
    `/data-models/${tableName}/records/${recordId}`
  );
  return response.data;
};

export default {
  saveRecord,
  saveRecordRecursively,
  getDBTables,
  getTableConfig,
  getTableData,
  createRecord,
  updateRecord,
  deleteRecord,
};
