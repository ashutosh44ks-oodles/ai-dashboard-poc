import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { IconCheck, IconLoader2, IconSelector } from "@tabler/icons-react";
import settingsService, {
  type AISettings,
  type OpenRouterModelOption,
} from "@/services/settings";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

function ModelPicker({
  id,
  label,
  description,
  value,
  serverDefault,
  models,
  onChange,
}: {
  id: string;
  label: string;
  description: string;
  value: string;
  serverDefault: string;
  models: OpenRouterModelOption[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);

  const options =
    value && !models.some((m) => m.id === value)
      ? [{ id: value, name: value }, ...models]
      : models;

  const selected = options.find((m) => m.id === value);

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <p className="text-muted-foreground text-xs">{description}</p>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal"
          >
            <span className="truncate">
              {selected?.name ?? serverDefault}
            </span>
            <IconSelector className="ml-2 size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search models..." />
            <CommandList>
              <CommandEmpty>No model found.</CommandEmpty>
              <CommandGroup>
                {options.map((m) => (
                  <CommandItem
                    key={m.id}
                    value={`${m.name} ${m.id}`}
                    onSelect={() => {
                      onChange(m.id);
                      setOpen(false);
                    }}
                  >
                    <IconCheck
                      className={cn(
                        "size-4",
                        value === m.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="truncate">{m.name}</span>
                    <span className="text-muted-foreground ml-auto text-xs truncate max-w-[40%]">
                      {m.id}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <p className="text-muted-foreground text-xs">
        Server default: {serverDefault}
      </p>
    </div>
  );
}

export default function Settings() {
  const queryClient = useQueryClient();
  const [apiKey, setApiKey] = useState("");
  const [modelDefault, setModelDefault] = useState("");
  const [modelAdvanced, setModelAdvanced] = useState("");
  const [modelUi, setModelUi] = useState("");

  const { data: settingsResponse, isLoading: settingsLoading } = useQuery({
    queryKey: ["ai-settings"],
    queryFn: settingsService.getAISettings,
  });

  const { data: modelsResponse, isLoading: modelsLoading } = useQuery({
    queryKey: ["ai-models"],
    queryFn: settingsService.getAvailableModels,
  });

  const settings: AISettings | undefined = settingsResponse?.data;
  const models: OpenRouterModelOption[] = modelsResponse?.data ?? [];

  useEffect(() => {
    if (settings) {
      setModelDefault(settings.models.default);
      setModelAdvanced(settings.models.advanced);
      setModelUi(settings.models.ui);
    }
  }, [settings]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["ai-settings"] });
    queryClient.invalidateQueries({ queryKey: ["ai-models"] });
  };

  const saveKeyMutation = useMutation({
    mutationFn: (key: string) =>
      settingsService.updateAISettings({ openrouterApiKey: key }),
    onSuccess: () => {
      toast.success("API key saved");
      setApiKey("");
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const clearKeyMutation = useMutation({
    mutationFn: () => settingsService.updateAISettings({ clearApiKey: true }),
    onSuccess: () => {
      toast.success("API key removed");
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const saveModelsMutation = useMutation({
    mutationFn: () =>
      settingsService.updateAISettings({
        model: modelDefault,
        modelAdvanced: modelAdvanced,
        modelUi: modelUi,
      }),
    onSuccess: () => {
      toast.success("Model preferences saved");
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (settingsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <IconLoader2 className="size-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm">
          Configure your OpenRouter API key and preferred models.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>OpenRouter API Key</CardTitle>
          <CardDescription>
            Use your own key for AI features. Without one, the server default is
            used. Get a key at{" "}
            <a
              href="https://openrouter.ai/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              openrouter.ai/keys
            </a>
            .
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {settings?.hasApiKey && settings.apiKeyMasked && (
            <p className="text-sm">
              Current key: <code>{settings.apiKeyMasked}</code>
            </p>
          )}
          <div className="space-y-2">
            <Label htmlFor="api-key">
              {settings?.hasApiKey ? "Replace API key" : "API key"}
            </Label>
            <Input
              id="api-key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={
                settings?.hasApiKey
                  ? "Enter new key to replace"
                  : "Using server default"
              }
            />
          </div>
          <div className="flex gap-2">
            <Button
              disabled={!apiKey.trim() || saveKeyMutation.isPending}
              onClick={() => saveKeyMutation.mutate(apiKey.trim())}
            >
              {saveKeyMutation.isPending && (
                <IconLoader2 className="mr-2 size-4 animate-spin" />
              )}
              Save key
            </Button>
            {settings?.hasApiKey && (
              <Button
                variant="outline"
                disabled={clearKeyMutation.isPending}
                onClick={() => clearKeyMutation.mutate()}
              >
                Clear key
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Model preferences</CardTitle>
          <CardDescription>
            Search and pick a model for each AI tier.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {modelsLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <IconLoader2 className="size-4 animate-spin" />
              Loading models…
            </div>
          ) : (
            <>
              <ModelPicker
                id="model-default"
                label="General (SQL & summaries)"
                description="Used for SQL generation, read queries, and chat summarization."
                value={modelDefault}
                serverDefault={settings?.serverDefaults.default ?? ""}
                models={models}
                onChange={setModelDefault}
              />
              <ModelPicker
                id="model-advanced"
                label="Advanced (data-model chat)"
                description="Used for recursive data-model conversations."
                value={modelAdvanced}
                serverDefault={settings?.serverDefaults.advanced ?? ""}
                models={models}
                onChange={setModelAdvanced}
              />
              <ModelPicker
                id="model-ui"
                label="UI generation (widgets)"
                description="Used for dashboard widget and chart generation."
                value={modelUi}
                serverDefault={settings?.serverDefaults.ui ?? ""}
                models={models}
                onChange={setModelUi}
              />
            </>
          )}
          <Button
            disabled={saveModelsMutation.isPending}
            onClick={() => saveModelsMutation.mutate()}
          >
            {saveModelsMutation.isPending && (
              <IconLoader2 className="mr-2 size-4 animate-spin" />
            )}
            Save models
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
