import { IconX, IconLoader2, IconPlus, IconSend2 } from "@tabler/icons-react";
import { Textarea } from "./ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { Input } from "./ui/input";
import { useRef, useState } from "react";
import { Badge } from "./ui/badge";

interface InputWithAttachmentProps {
  textAreaProps?: React.TextareaHTMLAttributes<HTMLTextAreaElement>;
  fileInputProps?: React.InputHTMLAttributes<HTMLInputElement>;
  includeFileInput?: boolean;
  includeSubmitButton: boolean;
  // only required if includeSubmitButton is true
  loading?: boolean;
  /** Enter submits the parent form; Shift+Enter inserts a newline */
  submitOnEnter?: boolean;
  // decoratives
  model?: string;
}

const InputWithAttachment = ({
  textAreaProps,
  fileInputProps,
  includeFileInput = true,
  includeSubmitButton = true,
  loading = false,
  submitOnEnter = false,
  model,
}: InputWithAttachmentProps) => {
  const [fileName, setFileName] = useState<string>("");
  const inputFileRef = useRef<HTMLInputElement>(null);
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!extension) return;
    if (["csv", "xlsx", "json"].includes(extension)) {
      // extractData(file, extension);
      if (fileInputProps?.onChange) fileInputProps.onChange(event);
    } else {
      removeFile();
      console.error("Unsupported file type:", extension);
    }
  };
  const removeFile = () => {
    setFileName("");
    if (!inputFileRef.current) return;
    inputFileRef.current.value = "";
  };
  const addFile = () => {
    if (!inputFileRef.current) return;
    inputFileRef.current.click();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    textAreaProps?.onKeyDown?.(event);
    if (!submitOnEnter || event.defaultPrevented || loading) return;
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  };

  return (
    <div className="w-full border-input rounded-md border bg-transparent px-3 py-1 text-base shadow-xs dark:bg-input/30">
      <Textarea
        className="w-full border-none focus-visible:border-none focus-visible:ring-0 px-0 py-2 dark:bg-transparent max-h-24 resize-none field-sizing-content min-h-10"
        placeholder="Type your prompt here..."
        {...textAreaProps}
        onKeyDown={handleKeyDown}
        name="prompt-input-with-attachment"
        required
      />
      {includeFileInput && (
        <Input
          type="file"
          className="hidden"
          name="file-input-with-attachment"
          accept=".csv, .xlsx, .json"
          {...fileInputProps}
          onChange={handleFileChange}
          ref={inputFileRef}
        />
      )}
      <div className="flex justify-between items-center my-1">
        <div className="flex items-center gap-2">
          {model && <Badge variant="secondary">Powered by {model}</Badge>}
          {includeFileInput ? (
            <Tooltip>
              <TooltipTrigger asChild>
                {fileName ? (
                  <Badge variant="secondary" className="h-6">
                    <div className="flex gap-1 items-center text-xs">
                      {fileName}
                      <IconX
                        className="cursor-pointer size-4"
                        onClick={removeFile}
                      />
                    </div>
                  </Badge>
                ) : (
                  <IconPlus className="size-5 cursor-pointer" onClick={addFile} />
                )}
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <span className="text-xs">Add files</span>
              </TooltipContent>
            </Tooltip>
          ) : (
            <span></span>
          )}
        </div>
        {includeSubmitButton && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="submit"
                className="rounded-full hover:bg-accent p-2 shrink-0 cursor-pointer"
                disabled={loading}
              >
                {loading ? (
                  <IconLoader2 className="animate-spin" />
                ) : (
                  <IconSend2 className="size-5" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <button className="text-xs">Submit</button>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  );
};

export default InputWithAttachment;
