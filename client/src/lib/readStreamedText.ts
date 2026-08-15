import throttle from "throttleit";

const DEFAULT_THROTTLE_MS = 100;

/**
 * Read a fetch body stream, accumulating text and emitting throttled UI updates.
 * Always flushes the final accumulated string (no trailing throttle delay).
 */
export async function readStreamedText(
  body: ReadableStream<Uint8Array>,
  onUpdate: (text: string) => void,
  options?: { throttleMs?: number }
): Promise<string> {
  const throttleMs = options?.throttleMs ?? DEFAULT_THROTTLE_MS;
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let accumulated = "";

  const emit = throttle((text: string) => {
    onUpdate(text);
  }, throttleMs);

  while (true) {
    const { done, value } = await reader.read();
    accumulated += decoder.decode(value, { stream: !done });
    emit(accumulated);
    if (done) {
      onUpdate(accumulated);
      break;
    }
  }

  return accumulated;
}
