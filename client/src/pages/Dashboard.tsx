import Widget from "@/components/Widget";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import widgetService from "@/services/widgets";
import type { APIResponse, Widget as WidgetType } from "@/lib/constants";

export default function Dashboard() {
  const { data } = useQuery<APIResponse<WidgetType[]>>({
    queryKey: ["widgets"],
    queryFn: widgetService.getAllWidgets,
  });
  const widgets = data?.data || [];

  const [expandedWidgetId, setExpandedWidgetId] = useState<string | null>(null);

  return (
    <div className="flex flex-1 flex-wrap gap-4">
      {widgets.map((widget) => (
        <Widget
          key={widget.id}
          {...widget}
          setExpandedWidgetId={setExpandedWidgetId}
          expandedWidgetId={expandedWidgetId}
        />
      ))}
    </div>
  );
}
