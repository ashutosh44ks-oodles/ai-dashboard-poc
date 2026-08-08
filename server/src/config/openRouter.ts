import OpenAI from "openai";
import dotenv from "dotenv";
import { PORT } from "../lib/constants.js";

dotenv.config();

export const OPENROUTER_BASE_URL =
  process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1";
// ponytail: openrouter/free rotates free models; override via env for a fixed model
export const OPENROUTER_MODEL =
  process.env.OPENROUTER_MODEL ?? "openrouter/free";
export const OPENROUTER_MODEL_ADVANCED =
  process.env.OPENROUTER_MODEL_ADVANCED ?? "cohere/north-mini-code:free";

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

export const openRouterClient = new OpenAI({
  baseURL: OPENROUTER_BASE_URL,
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": openRouterSiteUrl,
    "X-Title": "AI ERP Dashboard",
  },
});
