export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  id?: string;
  widget?: {
    prompt: string;
    sqlQuery: string;
    display: "suggest" | "show";
    suggestionMessage?: string;
  };
}
