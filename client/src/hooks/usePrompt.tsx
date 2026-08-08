import { useEffect, useState } from "react";
import type { User } from "./AuthContext";
import type { Widget } from "@/lib/constants";
import { toast } from "sonner";

interface UsePromptProps {
  prompt: Widget["prompt"];
  id: Widget["id"];
}

const usePrompt = ({ prompt, id }: UsePromptProps) => {
  const [data, setData] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [refetchCount, setFetchCount] = useState<number>(0);

  // Function to refetch data
  const refetch = () => {
    setFetchCount((prevCount) => prevCount + 1);
  };

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const user = localStorage.getItem("currentUser");
        if (!user) {
          throw new Error("User not found in localStorage");
        }
        const parsedUser: User = JSON.parse(user);
        const response = await fetch(
          `${import.meta.env.VITE_DB_BACKEND_URL}/ai/generate-ui`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-User-ID": parsedUser.user_id.toString() || "",
            },
            body: JSON.stringify({
              prompt,
              widgetId: id,
            }),
          }
        );
        if (!response.ok) {
          // log actual error response
          const errorResponse = await response.json();
          throw new Error(errorResponse.error || response.statusText);
        }

        // Set up stream reading utilities
        const decoder = new TextDecoder();
        const stream = response.body?.getReader();

        if (!stream) {
          throw new Error("response.body not found");
        }
        // Initialize accumulator for streamed response
        let streamResponse = "";
        // Read the stream chunk by chunk
        while (true) {
          const { done, value } = await stream.read();
          // Decode the chunk, considering if it's the final chunk
          const chunk = decoder.decode(value, { stream: !done });
          // Accumulate response and update state
          streamResponse += chunk;
          setData(streamResponse);
          // Break the loop when stream is complete
          if (done) {
            // copy the response to clipboard for debugging
            console.log({
              success: true,
              data: streamResponse,
              prompt: prompt,
            });
            // navigator.clipboard.writeText(streamResponse);
            break;
          }
        }
      } catch (error) {
        console.error("Error fetching widget data:", error);
        console.log({
          success: false,
          error: error,
          prompt: prompt,
        });
        setError(error instanceof Error ? error.message : "Unknown error");
        toast.error("Failed to create widget", {
          description: error instanceof Error ? error.message : "Please try again later.",
        });
        setData("");
      } finally {
        setLoading(false);
      }
    })();
  }, [prompt, id, refetchCount]);

  return {
    data,
    loading,
    error,
    refetch,
    isRefetching: loading && refetchCount > 0,
  };
};

export default usePrompt;
