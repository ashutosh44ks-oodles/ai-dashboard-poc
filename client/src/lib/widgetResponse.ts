import { Allow, parse as parsePartialJson } from "partial-json";

export type WidgetChartType =
  | "bar"
  | "pie"
  | "line"
  | "area"
  | "radar"
  | "radial";

export interface WidgetChartDataPoint {
  label: string;
  value: number;
}

export interface WidgetChart {
  type: WidgetChartType;
  title: string;
  data: WidgetChartDataPoint[];
}

export interface WidgetResponse {
  summary: string[];
  chart: WidgetChart;
  recommendations: string[];
}

export interface WidgetErrorResponse {
  error: string;
}

export interface PartialWidgetView {
  summary: string[];
  chart: WidgetChart | null;
  recommendations: string[];
  error?: string;
  isComplete: boolean;
}

const CHART_TYPES: WidgetChartType[] = [
  "bar",
  "pie",
  "line",
  "area",
  "radar",
  "radial",
];

/** Objects/arrays can be partial; strings and numbers must be complete (less flicker). */
const STREAM_PARSE_ALLOW = Allow.OBJ | Allow.ARR;

function stripCodeFence(raw: string): string {
  return raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
}

function isWidgetChartType(value: string): value is WidgetChartType {
  return CHART_TYPES.includes(value as WidgetChartType);
}

function parseStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function parseChartPartial(chart: unknown): WidgetChart | null {
  if (!chart || typeof chart !== "object") return null;
  const c = chart as Record<string, unknown>;
  const type = c.type;
  const title = c.title;
  const data = c.data;
  if (typeof type !== "string" || !isWidgetChartType(type)) return null;
  if (typeof title !== "string" || !title.trim()) return null;
  if (!Array.isArray(data)) return null;

  const points: WidgetChartDataPoint[] = [];
  for (const item of data) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    if (
      typeof row.label === "string" &&
      typeof row.value === "number" &&
      !Number.isNaN(row.value)
    ) {
      points.push({ label: row.label, value: row.value });
    }
  }
  if (points.length === 0) return null;
  return { type, title, data: points };
}

function toPartialView(
  parsed: Record<string, unknown>,
  isComplete: boolean
): PartialWidgetView | null {
  if (typeof parsed.error === "string") {
    return {
      summary: [],
      chart: null,
      recommendations: [],
      error: parsed.error,
      isComplete,
    };
  }

  const summary = parseStringArray(parsed.summary);
  const chart = parseChartPartial(parsed.chart);
  const recommendations = parseStringArray(parsed.recommendations);

  if (summary.length === 0 && !chart && recommendations.length === 0) {
    return null;
  }

  return {
    summary,
    chart,
    recommendations,
    isComplete,
  };
}

export function parseWidgetResponse(
  raw: string
): WidgetResponse | WidgetErrorResponse | null {
  if (!raw.trim()) return null;
  try {
    const parsed = JSON.parse(stripCodeFence(raw)) as Record<string, unknown>;
    if (typeof parsed.error === "string") {
      return { error: parsed.error };
    }
    if (
      Array.isArray(parsed.summary) &&
      parsed.chart &&
      typeof parsed.chart === "object" &&
      Array.isArray((parsed.chart as WidgetChart).data) &&
      Array.isArray(parsed.recommendations)
    ) {
      return parsed as unknown as WidgetResponse;
    }
    return null;
  } catch {
    return null;
  }
}

/** Progressive parse for streaming JSON widget responses. */
export function parsePartialWidgetResponse(
  raw: string,
  isStreaming: boolean
): PartialWidgetView | null {
  if (!raw.trim()) return null;

  const complete = parseWidgetResponse(raw);
  if (complete) {
    if ("error" in complete) {
      return {
        summary: [],
        chart: null,
        recommendations: [],
        error: complete.error,
        isComplete: true,
      };
    }
    return {
      summary: complete.summary,
      chart: complete.chart,
      recommendations: complete.recommendations,
      isComplete: true,
    };
  }

  if (!isStreaming) return null;

  try {
    const parsed = parsePartialJson(
      stripCodeFence(raw),
      STREAM_PARSE_ALLOW
    ) as Record<string, unknown>;
    if (!parsed || typeof parsed !== "object") return null;
    return toPartialView(parsed, false);
  } catch {
    return null;
  }
}
