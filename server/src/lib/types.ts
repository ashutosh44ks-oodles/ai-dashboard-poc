export interface Message {
  content: string;
  role: "user" | "assistant" | "system" | "developer";
}

export interface User {
  user_id: number;
  name: string;
  email: string;
  created_at: Date;
}
export interface Widget {
  id: string;
  user_id: number;
  prompt: string;
  sql_query: string | null;
  content: string | null;
  created_at: Date;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
export interface ApiResponsePageable<T = any>
  extends Omit<ApiResponse, "data"> {
  data?: {
    content: T[];
    totalElements: number;
  };
}

export interface QueryForPrompt {
  success: boolean;
  data?: string;
  error?: string;
}

export interface QueryForPromptWithMissingInfo {
  success: boolean;
  data?: {
    query: string | null;
    missing_info_message: string | null;
    query_success_message: string | null;
  };
  error?: string;
}

export interface DataForPrompt {
  success: boolean;
  data?: any;
  error?: string;
  updatedWidget?: Widget;
}

export type ForbiddenWordsDictionary = { word: string; weight: number }[];

export type AuditRole = "created" | "updated" | null;

export interface TableConfigBasic {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default?: string | null;
  is_identity?: string;
  is_primary_key?: boolean;
  is_auto_generated?: boolean;
  audit_role?: AuditRole;
  is_auto_managed?: boolean;
}
