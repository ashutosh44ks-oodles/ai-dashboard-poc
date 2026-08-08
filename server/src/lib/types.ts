export interface Message {
  content: string;
  role: "user" | "assistant" | "system" | "developer";
}

export interface User {
  user_id: number;
  name: string;
  email: string;
  created_at: Date;
  openrouter_api_key_encrypted?: string | null;
  openrouter_model?: string | null;
  openrouter_model_advanced?: string | null;
  openrouter_model_ui?: string | null;
}

export interface UserAISettings {
  hasApiKey: boolean;
  apiKeyMasked: string | null;
  usingOwnKey: boolean;
  models: {
    default: string;
    advanced: string;
    ui: string;
  };
  serverDefaults: {
    default: string;
    advanced: string;
    ui: string;
  };
}

export interface UpdateUserAISettingsPayload {
  openrouterApiKey?: string;
  clearApiKey?: boolean;
  model?: string;
  modelAdvanced?: string;
  modelUi?: string;
}

export interface OpenRouterModelOption {
  id: string;
  name: string;
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

export interface ChatQueryForPrompt {
  /** Legacy write-query field */
  query?: string | null;
  write_query?: string | null;
  read_query?: string | null;
  missing_info_message?: string | null;
  query_success_message?: string | null;
  refusal_message?: string | null;
  chart_display?: "none" | "suggest" | "show" | null;
  chart_suggestion_message?: string | null;
}

export interface QueryForPromptWithMissingInfo {
  success: boolean;
  data?: ChatQueryForPrompt;
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
