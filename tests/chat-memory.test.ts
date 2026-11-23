import test from "node:test";
import assert from "node:assert/strict";
import {
  buildChatMemory,
  estimatedTokens,
  type ChatMessage,
} from "../lib/chat-memory.ts";
test("memory retains recent complete turns within a configurable estimated token budget", () => {
  const history: ChatMessage[] = Array.from({ length: 20 }, (_, i) => [
    { role: "user" as const, content: `Question ${i}: ` + "q".repeat(240) },
    { role: "assistant" as const, content: `Answer ${i}: ` + "a".repeat(240) },
  ]).flat();
  const memory = buildChatMemory(
    history,
    "My next question",
    "Use simple English.",
    2000,
  );
  assert.ok(memory.summary.estimatedTokens <= 2000);
  assert.ok(memory.summary.omittedMessages > 0);
  assert.equal(memory.history[0].content.includes("Use simple English."), true);
  assert.equal(memory.history.at(-1)!.content.startsWith("Answer 19"), true);
  assert.equal(memory.summary.retainedMessages % 2, 0);
  assert.equal(
    history.length,
    40,
    "Trimming context must not remove saved history.",
  );
});
test("new chats have no prior messages, oversized input is rejected and estimates account for Burmese", () => {
  assert.equal(
    buildChatMemory([], "Hello", "", 4000).summary.retainedMessages,
    0,
  );
  assert.throws(() => buildChatMemory([], "x".repeat(10000), "", 2000));
  assert.throws(() => buildChatMemory([], "Hello", "", 3000));
  assert.ok(estimatedTokens("မြန်မာ") > estimatedTokens("abcdef"));
});
test("history cap keeps the latest 24 complete turns and skips orphaned messages", () => {
  const pairs: ChatMessage[] = Array.from({ length: 30 }, (_, i) => [
    { role: "user" as const, content: `Q${i}` },
    { role: "assistant" as const, content: `A${i}` },
  ]).flat();
  const memory = buildChatMemory(
    [
      { role: "assistant", content: "orphan" },
      ...pairs,
      { role: "user", content: "incomplete" },
    ],
    "Next",
    "",
    8000,
  );
  assert.equal(memory.summary.retainedMessages, 48);
  assert.equal(memory.history[0].content, "Q6");
  assert.equal(memory.history.at(-1)!.content, "A29");
});
