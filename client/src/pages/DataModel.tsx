import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import DataModelService from "@/services/dataModels";
import settingsService from "@/services/settings";
import InputWithAttachment from "@/components/InputWithAttachment";
import { ChatWidgetPreview } from "@/components/chat-widget-preview";
import type { ChatMessage } from "@/lib/types";
import { scrollToBottom } from "@/lib/utils";
import { useDataModelConversation } from "@/hooks/useDataModelConversation";
import { useRef } from "react";
import {
  Message as AIMessage,
  MessageAvatar as AIMessageAvatar,
  MessageContent as AIMessageContent,
} from "@/components/ChatItem";
import { useLoggedInUser } from "@/hooks/useLoggedInUser";

const DataModel = () => {
  const { messages, updateMessagesStack } = useDataModelConversation();

  const formRef = useRef<HTMLFormElement>(null);
  const { mutate, isPending } = useMutation({
    mutationFn: DataModelService.saveRecordRecursively,
    onSuccess: ({ data }: { data: ChatMessage[] }) => {
      console.log("Operation successful:", data);
      formRef.current?.reset();
      updateMessagesStack(data);
      setTimeout(scrollToBottom, 500);
    },
    onError: (err) => {
      console.error("Operation error:", err.message);
      toast.error("An error occurred while processing your request.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission logic here
    // const formData = new FormData();
    const inputRef = e.currentTarget.querySelector("textarea");
    if (inputRef === null) return;
    // formData.append("prompt", inputRef.value);
    // formData.append("history", JSON.stringify(messageHistory));
    // const fileRef: HTMLInputElement | null =
    //   e.currentTarget.querySelector("input[type='file']");
    // if (fileRef !== null) {
    //   const fileValue = fileRef.files?.[0];
    //   if (fileValue) {
    //     formData.append("file", fileValue);
    //   }
    // }
    // mutate(formData);
    mutate({
      prompt: inputRef.value,
      history: messages.map(({ role, content }) => ({ role, content })),
    });
  };

  const { user } = useLoggedInUser();
  const currentUserEmail = user?.email;
  const getInitials = (email: string) => {
    const parts = email.split("@")[0].split(".");
    return parts.map((part) => part.charAt(0).toUpperCase()).join("");
  };

  const { data: settingsResponse } = useQuery({
    queryKey: ["ai-settings"],
    queryFn: settingsService.getAISettings,
  });
  const defaultModel = settingsResponse?.data?.models?.default;

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <h1 className="text-3xl font-bold mb-4">Interact with Data Models</h1>
        <p className="text-gray-600 text-center mb-6">
          Add or Insert records into your data models using plain english you
          use everyday!
        </p>
        <form
          className="flex gap-4 items-center justify-center w-3/4"
          onSubmit={handleSubmit}
        >
          <InputWithAttachment
            includeSubmitButton
            loading={isPending}
            includeFileInput={false}
            submitOnEnter
            model={defaultModel}
          />
        </form>
      </div>
    );
  }
  return (
    <>
      <div className="flex flex-col items-between justify-center h-full gap-4">
        <div className="flex-1 space-y-2 w-full">
          {messages.map((msg, index) => (
            <AIMessage key={index} from={msg.role}>
              <AIMessageContent>
                <p>{msg.content}</p>
                {msg.widget && (
                  <ChatWidgetPreview
                    prompt={msg.widget.prompt}
                    sqlQuery={msg.widget.sqlQuery}
                    display={msg.widget.display}
                    suggestionMessage={msg.widget.suggestionMessage}
                  />
                )}
              </AIMessageContent>
              <AIMessageAvatar
                src="/avatars/shadcn.jpg"
                name={
                  msg.role === "user"
                    ? getInitials(currentUserEmail || "You")
                    : "AI"
                }
              />
            </AIMessage>
          ))}
        </div>
        <form
          className="flex gap-4 items-center justify-center w-full"
          onSubmit={handleSubmit}
          ref={formRef}
        >
          <InputWithAttachment
            includeSubmitButton
            loading={isPending}
            includeFileInput={false}
            submitOnEnter
            model={defaultModel}
          />
        </form>
      </div>
    </>
  );
};

export default DataModel;
