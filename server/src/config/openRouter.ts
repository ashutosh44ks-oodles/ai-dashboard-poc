import OpenAI from "openai";
import dotenv from "dotenv";
import { PORT, DEFAULT_OPENROUTER_MODEL } from "../lib/constants.js";
import * as userSettingsService from "../services/userSettingsService.js";

dotenv.config();

export const OPENROUTER_BASE_URL =
  process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1";
export const OPENROUTER_MODEL =
  process.env.OPENROUTER_MODEL ?? DEFAULT_OPENROUTER_MODEL;
export const OPENROUTER_MODEL_ADVANCED =
  process.env.OPENROUTER_MODEL_ADVANCED ?? DEFAULT_OPENROUTER_MODEL;
export const OPENROUTER_MODEL_UI =
  process.env.OPENROUTER_MODEL_UI ?? DEFAULT_OPENROUTER_MODEL;

function resolveOpenRouterSiteUrl(): string {
  const publicUrl = process.env.PUBLIC_URL?.trim();
  if (publicUrl) {
    return publicUrl.replace(/\/$/, "");
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Set PUBLIC_URL to your deployed app origin (e.g. https://app.example.com) in production."
    );
  }
  return `http://localhost:${PORT}`;
}

const openRouterSiteUrl = resolveOpenRouterSiteUrl();

function createOpenRouterClient(apiKey: string): OpenAI {
  return new OpenAI({
    baseURL: OPENROUTER_BASE_URL,
    apiKey,
    defaultHeaders: {
      "HTTP-Referer": openRouterSiteUrl,
      "X-Title": "AI ERP Dashboard",
    },
  });
}

export const openRouterClient = createOpenRouterClient(
  process.env.OPENROUTER_API_KEY
);

export interface UserAIConfig {
  client: OpenAI;
  models: {
    default: string;
    advanced: string;
    ui: string;
  };
  usingOwnKey: boolean;
}

interface CacheEntry {
  config: UserAIConfig;
  expiresAt: number;
}

// ponytail: in-memory TTL cache; upgrade to Redis for multi-instance deployments
const configCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60_000;

export function invalidateUserAIConfigCache(userId: string): void {
  configCache.delete(userId);
}

export async function resolveUserAIConfig(
  userId: string
): Promise<UserAIConfig> {
  const cached = configCache.get(userId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.config;
  }

  const numericUserId = parseInt(userId, 10);
  let apiKey = process.env.OPENROUTER_API_KEY;
  let usingOwnKey = false;

  if (!Number.isNaN(numericUserId)) {
    const userKey = await userSettingsService.getDecryptedApiKey(numericUserId);
    if (userKey) {
      apiKey = userKey;
      usingOwnKey = true;
    }
    const models = await userSettingsService.getUserModels(numericUserId);
    const config: UserAIConfig = {
      client: createOpenRouterClient(apiKey),
      models,
      usingOwnKey,
    };
    configCache.set(userId, {
      config,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });
    return config;
  }

  const config: UserAIConfig = {
    client: openRouterClient,
    models: {
      default: OPENROUTER_MODEL,
      advanced: OPENROUTER_MODEL_ADVANCED,
      ui: OPENROUTER_MODEL_UI,
    },
    usingOwnKey,
  };
  configCache.set(userId, {
    config,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
  return config;
}

export function getOpenRouterClient(): OpenAI {
  return openRouterClient;
}
