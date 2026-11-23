import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { randomUUID } from "node:crypto";
process.env.DATA_DIR = path.resolve(".test-data", "chats-" + randomUUID());
const { ensureUser } = await import("../lib/service.ts");
const { run, rows } = await import("../lib/db.ts");
const {
  createTutorChat,
  listTutorChats,
  readTutorChat,
  updateTutorChat,
  prepareTutorTurn,
  finishTutorTurn,
  releaseTutorTurn,
} = await import("../lib/tutor-chats.ts");
const { requestAI } = await import("../lib/ai.ts");
ensureUser("learner");
ensureUser("other");
test("old conversations migrate once without changing message IDs, bodies, dates or roles", () => {
  ensureUser("legacy");
  for (const [id, role, body] of [
    ["old-user", "user", "My earlier question"],
    ["old-assistant", "assistant", "My earlier answer"],
  ])
    run(
      "INSERT INTO tutor_messages(id,user_id,role,body,created_at) VALUES (?,?,?,?,?)",
      id,
      "legacy",
      role,
      body,
      "2026-11-23T12:00:00Z",
    );
  const before = rows(
    "SELECT id,role,body,created_at FROM tutor_messages WHERE user_id=? ORDER BY rowid",
    "legacy",
  );
  const chats = listTutorChats("legacy");
  assert.equal(chats.length, 1);
  assert.equal(chats[0].title, "Previous conversation");
  assert.equal(readTutorChat("legacy", chats[0].id).messages.length, 2);
  assert.equal(listTutorChats("legacy").length, 1);
  assert.deepEqual(
    rows(
      "SELECT id,role,body,created_at FROM tutor_messages WHERE user_id=? ORDER BY rowid",
      "legacy",
    ),
    before,
  );
});
test("chats isolate memory, save drafts and settings, and send real multi-turn context to OpenRouter", async () => {
  const first = createTutorChat("learner"),
    second = createTutorChat("learner");
  const a = prepareTutorTurn("learner", first.id, "I struggle with Not Given.");
  finishTutorTurn(
    "learner",
    a,
    "Look for missing information rather than contradiction.",
  );
  updateTutorChat("learner", first.id, {
    title: "Reading practice",
    contextNotes: "Explain in simple English.",
    windowTokens: 2000,
    draft: "Can you give an example?",
  });
  const restored = readTutorChat("learner", first.id);
  assert.equal(restored.chat.title, "Reading practice");
  assert.equal(restored.chat.draft, "Can you give an example?");
  assert.equal(restored.chat.window_tokens, 2000);
  const b = prepareTutorTurn("learner", first.id, "Can you give an example?");
  let payload: any;
  await requestAI("Tutor", "Can you give an example?", {
    env: { AI_PROVIDER: "openrouter", OPENROUTER_API_KEY: "test-only" },
    history: b.history,
    fetcher: (async (_url: any, init: any) => {
      payload = JSON.parse(init.body);
      return Response.json({
        choices: [{ message: { content: "Here is an example." } }],
      });
    }) as typeof fetch,
  });
  assert.deepEqual(
    payload.messages.map((m: any) => m.role),
    ["system", "user", "user", "assistant", "user"],
  );
  assert.ok(payload.messages[1].content.includes("Explain in simple English."));
  assert.ok(payload.messages[2].content.includes("Not Given"));
  finishTutorTurn("learner", b, "Here is an example.");
  assert.equal(readTutorChat("learner", first.id).messages.length, 4);
  assert.equal(readTutorChat("learner", first.id).chat.draft, "");
  const clean = prepareTutorTurn("learner", second.id, "A different topic");
  assert.deepEqual(clean.history, []);
  releaseTutorTurn("learner", clean);
  assert.throws(() => readTutorChat("other", first.id));
  assert.throws(() =>
    updateTutorChat("other", first.id, { draft: "injected" }),
  );
  assert.throws(() => prepareTutorTurn("other", first.id, "injected"));
});
test("in-flight requests serialize each chat; failures keep the draft and create no fake reply", () => {
  const chat = createTutorChat("learner"),
    a = prepareTutorTurn("learner", chat.id, "Please help with grammar.");
  assert.throws(() => prepareTutorTurn("learner", chat.id, "Second request"));
  assert.throws(() =>
    updateTutorChat("learner", chat.id, { draft: "Overwrite" }),
  );
  assert.equal(
    "request_token" in listTutorChats("learner").find((c) => c.id === chat.id)!,
    false,
  );
  releaseTutorTurn("learner", a);
  assert.equal(readTutorChat("learner", chat.id).messages.length, 0);
  assert.equal(
    readTutorChat("learner", chat.id).chat.draft,
    "Please help with grammar.",
  );
  const next = prepareTutorTurn("learner", chat.id, "Try again");
  assert.throws(() => finishTutorTurn("learner", a, "Stale answer"));
  finishTutorTurn("learner", next, "The current answer.");
  assert.equal(readTutorChat("learner", chat.id).messages.length, 2);
});
test("invalid memory settings are rejected and personal-data deletion cascades to chats and messages", () => {
  const chat = createTutorChat("learner");
  assert.throws(() =>
    updateTutorChat("learner", chat.id, { windowTokens: 123 }),
  );
  assert.throws(() =>
    updateTutorChat("learner", chat.id, { contextNotes: "x".repeat(2001) }),
  );
  ensureUser("remove");
  const removable = createTutorChat("remove"),
    turn = prepareTutorTurn(
      "remove",
      removable.id,
      "Delete this test conversation later.",
    );
  finishTutorTurn("remove", turn, "Test response.");
  run("DELETE FROM users WHERE id=?", "remove");
  assert.equal(
    rows("SELECT * FROM tutor_chats WHERE user_id=?", "remove").length,
    0,
  );
  assert.equal(
    rows("SELECT * FROM tutor_messages WHERE user_id=?", "remove").length,
    0,
  );
});
