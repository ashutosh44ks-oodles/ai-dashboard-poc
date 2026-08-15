import { memo, useEffect, useMemo, useRef } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  parsePartialWidgetResponse,
  type PartialWidgetView,
} from "@/lib/widgetResponse";
import WidgetChart from "./WidgetChart";

interface WidgetContentProps {
  response: string;
  isStreaming: boolean;
}

function ChartSkeleton() {
  return (
    <div className="flex flex-col items-center gap-4 py-2">
      <Skeleton className="h-48 w-full max-w-xs rounded-full" />
      <div className="flex gap-3">
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-3 w-12" />
      </div>
    </div>
  );
}

function SummarySkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-4 w-80" />
      <Skeleton className="h-4 w-56" />
      <Skeleton className="h-4 w-40" />
    </div>
  );
}

function RecommendationsSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-72" />
    </div>
  );
}

function StreamingShell() {
  return (
    <Card className="min-h-138">
      <CardHeader>
        <CardTitle className="text-base">Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <SummarySkeleton />
      </CardContent>
    </Card>
  );
}

const MemoWidgetChart = memo(WidgetChart);

function WidgetBody({
  view,
  isStreaming,
  streamEpoch,
}: {
  view: PartialWidgetView;
  isStreaming: boolean;
  streamEpoch: number;
}) {
  const revealed = useRef({
    summary: false,
    chart: false,
    recommendations: false,
  });

  useEffect(() => {
    revealed.current = {
      summary: false,
      chart: false,
      recommendations: false,
    };
  }, [streamEpoch]);

  // Expand-only sticky flags (update during render so skeleton drops on first paint)
  if (view.summary.length > 0) revealed.current.summary = true;
  if (view.chart) revealed.current.chart = true;
  if (view.recommendations.length > 0) revealed.current.recommendations = true;

  const showSummarySkeleton =
    isStreaming && !revealed.current.summary && view.summary.length === 0;
  const showChartSkeleton =
    isStreaming &&
    !revealed.current.chart &&
    !view.chart &&
    revealed.current.summary;
  const showRecommendationsSkeleton =
    isStreaming &&
    !revealed.current.recommendations &&
    view.recommendations.length === 0 &&
    (revealed.current.chart || showChartSkeleton);

  return (
    <Card className="min-h-138">
      <CardHeader>
        <CardTitle className="text-base">Loading Widget</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {view.summary.length > 0 ? (
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {view.summary.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        ) : showSummarySkeleton ? (
          <SummarySkeleton />
        ) : null}

        {view.chart ? (
          <MemoWidgetChart chart={view.chart} />
        ) : showChartSkeleton ? (
          <ChartSkeleton />
        ) : null}

        {view.recommendations.length > 0 || showRecommendationsSkeleton ? (
          <div>
            <h4 className="mb-2 text-sm font-medium">Recommendations</h4>
            {view.recommendations.length > 0 ? (
              <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                {view.recommendations.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            ) : (
              <RecommendationsSkeleton />
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

const WidgetContent = ({ response, isStreaming }: WidgetContentProps) => {
  const streamEpochRef = useRef(0);
  const prevStreamingRef = useRef(false);

  useEffect(() => {
    if (isStreaming && !prevStreamingRef.current) {
      streamEpochRef.current += 1;
    }
    prevStreamingRef.current = isStreaming;
  }, [isStreaming]);

  const view = useMemo(
    () => parsePartialWidgetResponse(response, isStreaming),
    [response, isStreaming]
  );

  if (!view) {
    return isStreaming ? <StreamingShell /> : (
      <Card className="min-h-138">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {response || "Generating..."}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (view.error) {
    return (
      <Card className="min-h-138 border-destructive/50">
        <CardContent className="pt-6">
          <p className="text-sm text-destructive">{view.error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <WidgetBody
      view={view}
      isStreaming={isStreaming}
      streamEpoch={streamEpochRef.current}
    />
  );
};

export default WidgetContent;
