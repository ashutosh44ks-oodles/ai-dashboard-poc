import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { parseWidgetResponse } from "@/lib/widgetResponse";
import WidgetChart from "./WidgetChart";
import SkeletonWidget from "./SkeletonWidget";

interface WidgetContentProps {
  response: string;
  isStreaming: boolean;
}

const WidgetContent = ({ response, isStreaming }: WidgetContentProps) => {
  const parsed = parseWidgetResponse(response);

  if (!parsed && isStreaming) {
    return <SkeletonWidget />;
  }

  if (!parsed) {
    return (
      <Card className="min-h-138">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {response || "Generating..."}
          </p>
        </CardContent>
      </Card>
    );
  }

  if ("error" in parsed) {
    return (
      <Card className="min-h-138 border-destructive/50">
        <CardContent className="pt-6">
          <p className="text-sm text-destructive">{parsed.error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="min-h-138">
      <CardHeader>
        <CardTitle className="text-base">Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <ul className="list-disc space-y-1 pl-5 text-sm">
          {parsed.summary.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>

        <WidgetChart chart={parsed.chart} />

        <div>
          <h4 className="mb-2 text-sm font-medium">Recommendations</h4>
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {parsed.recommendations.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default WidgetContent;
