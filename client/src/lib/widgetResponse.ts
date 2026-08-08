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

function stripCodeFence(raw: string): string {
  return raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
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
