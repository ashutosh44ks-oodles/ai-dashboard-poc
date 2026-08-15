import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { IconChartBar, IconLoader2, IconPlus } from "@tabler/icons-react";
import WidgetContent from "./WidgetContent";
import type { User } from "@/hooks/AuthContext";
import widgetService from "@/services/widgets";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { readStreamedText } from "@/lib/readStreamedText";

interface ChatWidgetPreviewProps {
  prompt: string;
  sqlQuery: string;
  display: "suggest" | "show";
  suggestionMessage?: string;
}

export function ChatWidgetPreview({
  prompt,
  sqlQuery,
  display,
  suggestionMessage,
}: ChatWidgetPreviewProps) {
  const [revealed, setRevealed] = useState(display === "show");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(display === "show");
  const [error, setError] = useState<string | null>(null);
  const [addedToDashboard, setAddedToDashboard] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!revealed) return;

    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        setContent("");

        const user = localStorage.getItem("currentUser");
        if (!user) throw new Error("User not found");

        const parsedUser: User = JSON.parse(user);
        const response = await fetch(
          `${import.meta.env.VITE_DB_BACKEND_URL}/ai/preview-widget`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-User-ID": parsedUser.user_id.toString(),
            },
            body: JSON.stringify({ prompt, sqlQuery }),
          }
        );

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || response.statusText);
        }

        if (!response.body) throw new Error("No response stream");

        await readStreamedText(response.body, (text) => {
          if (!cancelled) setContent(text);
        });
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load widget");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [prompt, sqlQuery, revealed]);

  const { mutate: saveToDashboard, isPending: saving } = useMutation({
    mutationFn: () =>
      widgetService.saveChatWidgetToDashboard({
        prompt,
        sqlQuery,
        content,
      }),
    onSuccess: () => {
      setAddedToDashboard(true);
      toast.success("Widget added to dashboard");
      queryClient.invalidateQueries({ queryKey: ["widgets"] });
    },
    onError: (err) => toast.error(err.message),
  });

  if (display === "suggest" && !revealed) {
    return (
      <div className="mt-3 flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">
          {suggestionMessage ||
            "This result could be easier to scan as a chart."}
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="self-start"
          onClick={() => setRevealed(true)}
        >
          <IconChartBar className="size-4" />
          Show chart
        </Button>
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-destructive">{error}</p>;
  }

  return (
    <div className="mt-3 w-full max-w-md">
      <WidgetContent response={content} isStreaming={loading} />
      {addedToDashboard ? (
        <p className="mt-2 text-sm text-muted-foreground">Added to dashboard</p>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-2"
          disabled={loading || !content.trim() || saving}
          onClick={() => saveToDashboard()}
        >
          {saving ? (
            <IconLoader2 className="size-4 animate-spin" />
          ) : (
            <IconPlus className="size-4" />
          )}
          Add to dashboard
        </Button>
      )}
    </div>
  );
}
