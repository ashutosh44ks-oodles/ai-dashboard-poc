import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import usePrompt from "../hooks/usePrompt";
import type { Widget as WidgetType } from "../lib/constants";
import { IconRefresh } from "@tabler/icons-react";
import SkeletonWidget from "./SkeletonWidget";
import { Button } from "./ui/button";
import WidgetWrapper from "./WidgetWrapper";
import WidgetControls from "./WidgetControls";
import WidgetContent from "./WidgetContent";
// import { experimental_streamedQuery, useQuery } from "@tanstack/react-query";
// import widgetService from "@/services/widgets";

interface WidgetProps extends WidgetType {
  setExpandedWidgetId: (id: string | null) => void;
  expandedWidgetId: string | null;
}

const Widget = ({
  id,
  prompt,
  // content,
  setExpandedWidgetId,
  expandedWidgetId,
}: WidgetProps) => {
  // const {
  //   data: c1Response = "",
  //   isLoading: c1ResponseLoading,
  //   error: c1ResponseError,
  //   refetch: refetchC1Response,
  //   isRefetching: isC1ResponseRefetching,
  // } = useQuery({
  //   queryKey: ["widget", id],
  //   queryFn: experimental_streamedQuery({
  //     queryFn: () => widgetService.generateUIForWidget(id, prompt),
  //   }),
  //   enabled: !!prompt && !!id,
  //   select: (data: string[]) => data.join(""),
  // });

  const {
    data: c1Response,
    loading: c1ResponseLoading,
    error: c1ResponseError,
    refetch: refetchC1Response,
    isRefetching: isC1ResponseRefetching,
  } = usePrompt({ prompt, id });

  // const c1Response = `<content>{ &quot;component&quot;: { &quot;component&quot;: &quot;Card&quot;, &quot;props&quot;: { &quot;children&quot;: [ { &quot;component&quot;: &quot;CardHeader&quot;, &quot;props&quot;: { &quot;title&quot;: &quot;Yes/No Distribution&quot;, &quot;subtitle&quot;: &quot;Equal 50-50 Split Analysis&quot; } }, { &quot;component&quot;: &quot;PieChart&quot;, &quot;props&quot;: { &quot;categoryKey&quot;: &quot;response&quot;, &quot;dataKey&quot;: &quot;value&quot;, &quot;data&quot;: [ { &quot;response&quot;: &quot;Yes&quot;, &quot;value&quot;: 50 }, { &quot;response&quot;: &quot;No&quot;, &quot;value&quot;: 50 } ] } }, { &quot;component&quot;: &quot;Accordion&quot;, &quot;props&quot;: { &quot;children&quot;: [ { &quot;value&quot;: &quot;analysis&quot;, &quot;trigger&quot;: { &quot;text&quot;: &quot;Detailed Analysis&quot; }, &quot;content&quot;: [ { &quot;component&quot;: &quot;TextContent&quot;, &quot;props&quot;: { &quot;textMarkdown&quot;: &quot;### Distribution Analysis\n\nThe data shows a perfect 50-50 split between Yes and No responses:\n\n- **Yes**: 50%\n- **No**: 50%\n\n### Key Observations\n- The distribution is perfectly balanced\n- There is no majority preference\n- Equal representation of both options\n\n### Recommendations\n1. Consider analyzing additional factors to understand decision drivers\n2. If this represents a decision outcome, additional criteria may be needed for tie-breaking\n3. Perfect splits might indicate a need for more granular response options&quot; } } ] } ] } } ] } } }</content>`;
  // const c1ResponseLoading = false; // Simulating loading state
  // const c1ResponseError = null; // Simulating no error
  // const refetchC1Response = () => {
  //   console.log("Refetching C1 response...");
  // };
  // const isC1ResponseRefetching = false; // Simulating no refetching state

  const handleExpand = () => {
    if (expandedWidgetId === id) {
      setExpandedWidgetId(null);
    } else {
      setExpandedWidgetId(id);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };
  const isExpand = expandedWidgetId === id;
  if (expandedWidgetId !== null && !isExpand) return null;
  if (c1Response)
    return (
      <WidgetWrapper
        id={id}
        isExpand={isExpand}
        controls={
          <WidgetControls
            refetchC1Response={refetchC1Response}
            handleExpand={handleExpand}
            isExpand={isExpand}
            widgetId={id}
          />
        }
      >
        <div className="min-h-138">
          <WidgetContent
            response={c1Response}
            isStreaming={c1ResponseLoading}
          />
        </div>
      </WidgetWrapper>
    );
  // We can work on this later to handle the loading state better.
  // Basically we can show last content while loading new content
  // the new content will NOT be streamed because
  // streamed content is loaded top to bottom (including the card)
  // and we want instant replacement of old content with new content
  if (c1ResponseError) return null;
  return (
    <Card className="w-96 h-138">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Widget</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={refetchC1Response}
            className="cursor-pointer"
          >
            <IconRefresh
              className={isC1ResponseRefetching ? "animate-spin" : ""}
            />
          </Button>
        </CardTitle>
        <CardDescription className="overflow-hidden text-ellipsis whitespace-nowrap max-w-72">
          {prompt}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {c1ResponseLoading ? <SkeletonWidget /> : <span>...</span>}
      </CardContent>
    </Card>
  );
};

export default Widget;
