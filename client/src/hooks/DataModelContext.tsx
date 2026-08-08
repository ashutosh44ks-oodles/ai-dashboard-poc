import type { ChatMessage } from "@/lib/types";
import { createContext } from "react";

export type CustomMessage = ChatMessage;

export type DataModelContextType = {
  messages: CustomMessage[];
  updateMessagesStack: (messages: CustomMessage[]) => void;
  clearMessages: () => void;
};
const defaultDataModelContext: DataModelContextType = {
  messages: [],
  updateMessagesStack: () => {},
  clearMessages: () => {},
};

// Create the context with an initial value of undefined.
// The custom hook will handle the null check.
export const DataModelContext = createContext<DataModelContextType>(defaultDataModelContext);
