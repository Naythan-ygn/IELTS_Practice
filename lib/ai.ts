// Server-side provider adapter. Never import this module into client components.
import type { ChatMessage } from "./chat-memory";
export type AIEnvironment = Record<string, string | undefined>;
export class AIError extends Error {
  constructor(
    message: string,
    public status = 503,
  ) {
    super(message);
  }
}
export function aiStatus(env: AIEnvironment = process.env) {
  const provider =
    env.AI_PROVIDER?.trim().toLowerCase() ||
    (env.OPENROUTER_API_KEY?.trim() ? "openrouter" : "openai");
  const valid = provider === "openrouter" || provider === "openai";
  const model =
    provider === "openrouter"
      ? env.OPENROUTER_MODEL?.trim() || "openai/gpt-4.1-mini"
      : env.OPENAI_MODEL?.trim() || "gpt-4.1-mini";
  return {
    enabled:
      valid &&
      !!(provider === "openrouter"
        ? env.OPENROUTER_API_KEY?.trim()
        : env.OPENAI_API_KEY?.trim()),
    provider:
      provider === "openrouter"
        ? "OpenRouter"
        : provider === "openai"
          ? "OpenAI"
          : "Invalid provider",
    model: valid ? model : null,
  };
}
export async function requestAI(
  instructions: string,
  input: string,
  options: {
    fetcher?: typeof fetch;
    env?: AIEnvironment;
    history?: ChatMessage[];
  } = {},
) {
  const env = options.env || process.env,
    status = aiStatus(env);
  if (!status.enabled)
    throw new AIError(
      "AI is not configured. Set AI_PROVIDER=openrouter and OPENROUTER_API_KEY in .env.local, then restart.",
    );
  const router = status.provider === "OpenRouter",
    key = (router ? env.OPENROUTER_API_KEY : env.OPENAI_API_KEY)!.trim();
  let response: Response;
  try {
    response = await (options.fetcher || fetch)(
      router
        ? "https://openrouter.ai/api/v1/chat/completions"
        : "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
          ...(router ? { "X-OpenRouter-Title": "IELTS Sprint 30" } : {}),
        },
        body: JSON.stringify(
          router
            ? {
                model: status.model,
                messages: [
                  { role: "system", content: instructions },
                  ...(options.history || []),
                  { role: "user", content: input },
                ],
                max_tokens: 3000,
                stream: false,
              }
            : {
                model: status.model,
                instructions,
                input: options.history?.length
                  ? [...options.history, { role: "user", content: input }]
                  : input,
                max_output_tokens: 3000,
              },
        ),
        signal: AbortSignal.timeout(60000),
      },
    );
  } catch (e) {
    if (
      (e as Error).name === "TimeoutError" ||
      (e as Error).name === "AbortError"
    )
      throw new AIError(
        "AI feedback timed out. Your work is saved; try again later.",
        504,
      );
    throw new AIError(
      "Could not reach the AI provider. Check the server connection and try again.",
    );
  }
  if (!response.ok) {
    const errors: Record<number, string> = {
      401: `${status.provider} rejected the API key. Check the server configuration.`,
      403: `${status.provider} denied access to the selected model.`,
      402: "The AI account has insufficient credits. Check your provider billing.",
      404: "The selected AI model is unavailable. Check the configured model ID.",
      429: "The AI provider is rate limiting requests. Please wait and retry.",
    };
    throw new AIError(
      errors[response.status] ||
        `AI provider unavailable (${response.status}). Your work is saved.`,
      response.status === 429 ? 429 : 503,
    );
  }
  let payload: any;
  try {
    payload = await response.json();
  } catch {
    throw new AIError(
      "The AI provider returned an invalid response. Please retry.",
      502,
    );
  }
  if (payload.error)
    throw new AIError(
      "The AI provider could not complete the request. Your work is saved.",
      502,
    );
  let text: string;
  if (router) {
    const message = payload.choices?.[0]?.message?.content;
    text =
      typeof message === "string"
        ? message
        : Array.isArray(message)
          ? message
              .filter(
                (part: any) =>
                  part.type === "text" && typeof part.text === "string",
              )
              .map((part: any) => part.text)
              .join("\n")
          : "";
    if (payload.choices?.[0]?.finish_reason === "length")
      throw new AIError(
        "AI feedback was cut short. Try reviewing a shorter response or a single question.",
        502,
      );
  } else
    text =
      payload.output
        ?.flatMap((item: any) => item.content || [])
        .filter(
          (item: any) =>
            item.type === "output_text" && typeof item.text === "string",
        )
        .map((item: any) => item.text)
        .join("\n") || "";
  if (!text.trim())
    throw new AIError(
      "The AI provider returned no feedback. Please retry.",
      502,
    );
  return {
    answer: text.trim(),
    provider: status.provider,
    model: status.model,
  };
}
