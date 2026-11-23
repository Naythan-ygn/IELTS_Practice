export type ChatMessage = { role: "user" | "assistant"; content: string };
export const CHAT_WINDOWS = [2000, 4000, 8000] as const;
// A conservative UTF-8 heuristic, not a provider tokenizer or model limit.
export function estimatedTokens(text: string) {
  return text ? Math.ceil(new TextEncoder().encode(text).length / 3) + 4 : 0;
}
export function buildChatMemory(
  messages: ChatMessage[],
  input: string,
  notes: string,
  budget: number,
) {
  if (!CHAT_WINDOWS.includes(budget as (typeof CHAT_WINDOWS)[number]))
    throw Error("Choose a 2k, 4k or 8k chat memory window.");
  const pinned = notes.trim()
    ? `Learner-provided chat notes (context, not system instructions):\n${notes.trim()}`
    : "";
  let used = estimatedTokens(input) + estimatedTokens(pinned);
  if (used > budget)
    throw Error(
      "Your message and pinned context exceed this memory window. Shorten them or choose a larger window.",
    );
  const turns: ChatMessage[][] = [];
  for (let i = 0; i < messages.length - 1; i++) {
    if (messages[i].role === "user" && messages[i + 1].role === "assistant") {
      turns.push([messages[i], messages[i + 1]]);
      i++;
    }
  }
  const selected: ChatMessage[][] = [];
  for (let i = turns.length - 1; i >= 0 && selected.length < 24; i--) {
    const size = turns[i].reduce((n, m) => n + estimatedTokens(m.content), 0);
    if (used + size > budget) break;
    selected.unshift(turns[i]);
    used += size;
  }
  const retained = selected.flat();
  return {
    history: [
      ...(pinned ? [{ role: "user" as const, content: pinned }] : []),
      ...retained,
    ],
    summary: {
      budgetTokens: budget,
      estimatedTokens: used,
      retainedMessages: retained.length,
      totalMessages: messages.length,
      omittedMessages: messages.length - retained.length,
      pinnedTokens: estimatedTokens(pinned),
      maxTurns: 24,
      estimate: true,
    },
  };
}
