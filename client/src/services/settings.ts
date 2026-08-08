import api from "@/lib/api";

export interface AISettings {
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

export interface OpenRouterModelOption {
  id: string;
  name: string;
}

export interface UpdateAISettingsPayload {
  openrouterApiKey?: string;
  clearApiKey?: boolean;
  model?: string;
  modelAdvanced?: string;
  modelUi?: string;
}

const getAISettings = async () => {
  const response = await api.get("/settings/ai");
  return response.data;
};

const updateAISettings = async (payload: UpdateAISettingsPayload) => {
  const response = await api.put("/settings/ai", payload);
  return response.data;
};

const getAvailableModels = async () => {
  const response = await api.get("/settings/ai/models");
  return response.data;
};

export default {
  getAISettings,
  updateAISettings,
  getAvailableModels,
};
