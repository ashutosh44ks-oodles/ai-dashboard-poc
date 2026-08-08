import { DEFAULT_OPENROUTER_MODEL } from "../lib/constants.js";
import { decrypt, encrypt, maskApiKey } from "../lib/crypto.js";
import {
  OpenRouterModelOption,
  UpdateUserAISettingsPayload,
  UserAISettings,
} from "../lib/types.js";

import { query } from "../config/db.js";

interface UserAISettingsRow {
  openrouter_api_key_encrypted: string | null;
  openrouter_model: string | null;
  openrouter_model_advanced: string | null;
  openrouter_model_ui: string | null;
}

const OPENROUTER_BASE_URL =
  process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1";

const SERVER_DEFAULTS = {
  default: process.env.OPENROUTER_MODEL ?? DEFAULT_OPENROUTER_MODEL,
  advanced: process.env.OPENROUTER_MODEL_ADVANCED ?? DEFAULT_OPENROUTER_MODEL,
  ui:
    process.env.OPENROUTER_MODEL_UI ??
    process.env.OPENROUTER_MODEL ??
    DEFAULT_OPENROUTER_MODEL,
};

async function getUserAISettingsRow(
  userId: number
): Promise<UserAISettingsRow | null> {
  const result = await query<UserAISettingsRow>(
    `SELECT openrouter_api_key_encrypted, openrouter_model, openrouter_model_advanced, openrouter_model_ui
     FROM users WHERE user_id = $1`,
    [userId]
  );
  return result.rows[0] ?? null;
}

function resolveModels(row: UserAISettingsRow | null) {
  return {
    default: row?.openrouter_model ?? SERVER_DEFAULTS.default,
    advanced: row?.openrouter_model_advanced ?? SERVER_DEFAULTS.advanced,
    ui: row?.openrouter_model_ui ?? SERVER_DEFAULTS.ui,
  };
}

export async function getAISettings(userId: number): Promise<UserAISettings> {
  const row = await getUserAISettingsRow(userId);
  const hasApiKey = Boolean(row?.openrouter_api_key_encrypted);
  let apiKeyMasked: string | null = null;
  if (hasApiKey && row?.openrouter_api_key_encrypted) {
    try {
      const decrypted = decrypt(row.openrouter_api_key_encrypted);
      apiKeyMasked = maskApiKey(decrypted);
    } catch {
      apiKeyMasked = "••••••••";
    }
  }

  return {
    hasApiKey,
    apiKeyMasked,
    usingOwnKey: hasApiKey,
    models: resolveModels(row),
    serverDefaults: SERVER_DEFAULTS,
  };
}

export async function updateAISettings(
  userId: number,
  payload: UpdateUserAISettingsPayload
): Promise<UserAISettings> {
  const updates: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (payload.clearApiKey) {
    updates.push(`openrouter_api_key_encrypted = NULL`);
  } else if (payload.openrouterApiKey?.trim()) {
    updates.push(`openrouter_api_key_encrypted = $${paramIndex}`);
    values.push(encrypt(payload.openrouterApiKey.trim()));
    paramIndex++;
  }

  if (payload.model !== undefined) {
    updates.push(`openrouter_model = $${paramIndex}`);
    values.push(payload.model.trim() || null);
    paramIndex++;
  }
  if (payload.modelAdvanced !== undefined) {
    updates.push(`openrouter_model_advanced = $${paramIndex}`);
    values.push(payload.modelAdvanced.trim() || null);
    paramIndex++;
  }
  if (payload.modelUi !== undefined) {
    updates.push(`openrouter_model_ui = $${paramIndex}`);
    values.push(payload.modelUi.trim() || null);
    paramIndex++;
  }

  if (updates.length > 0) {
    values.push(userId);
    await query(
      `UPDATE users SET ${updates.join(", ")} WHERE user_id = $${paramIndex}`,
      values
    );
  }

  return getAISettings(userId);
}

export async function getDecryptedApiKey(userId: number): Promise<string | null> {
  const row = await getUserAISettingsRow(userId);
  if (!row?.openrouter_api_key_encrypted) return null;
  return decrypt(row.openrouter_api_key_encrypted);
}

export async function getUserModels(userId: number) {
  const row = await getUserAISettingsRow(userId);
  return resolveModels(row);
}

export async function getAvailableModels(
  userId: number
): Promise<OpenRouterModelOption[]> {
  const userKey = await getDecryptedApiKey(userId);
  const apiKey = userKey ?? process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("No OpenRouter API key configured");
  }

  const response = await fetch(`${OPENROUTER_BASE_URL}/models`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch models: ${response.statusText}`);
  }

  const body = (await response.json()) as {
    data?: Array<{ id: string; name?: string }>;
  };

  return (body.data ?? [])
    .map((m) => ({ id: m.id, name: m.name ?? m.id }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
