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
await ensureUser("learner");
await ensureUser("other");
test("old conversations migrate once without changing message IDs, bodies, dates or roles", async () => {
  await ensureUser("legacy");
  for (const [id, role, body] of [
    ["old-user", "user", "My earlier question"],
    ["old-assistant", "assistant", "My earlier answer"],
  ])
    await run(
      "INSERT INTO tutor_messages(id,user_id,role,body,created_at) VALUES (?,?,?,?,?)",
      id,
      "legacy",
      role,
      body,
      "2026-11-23T12:00:00Z",
    );
  const before = await rows(
    "SELECT id,role,body,created_at FROM tutor_messages WHERE user_id=? ORDER BY rowid",
    "legacy",
  );
  const chats = await listTutorChats("legacy");
  assert.equal(chats.length, 1);
  assert.equal(chats[0].title, "Previous conversation");
  assert.equal((await readTutorChat("legacy", chats[0].id)).messages.length, 2);
  assert.equal((await listTutorChats("legacy")).length, 1);
  assert.deepEqual(
    await rows(
      "SELECT id,role,body,created_at FROM tutor_messages WHERE user_id=? ORDER BY rowid",
      "legacy",
    ),
    before,
  );
});
test("chats isolate memory, save drafts and settings, and send real multi-turn context to OpenRouter", async () => {
  const first = await createTutorChat("learner"),
    second = await createTutorChat("learner");
  const a = await prepareTutorTurn(
    "learner",
    first.id,
    "I struggle with Not Given.",
  );
  await finishTutorTurn(
    "learner",
    a,
    "Look for missing information rather than contradiction.",
  );
  await updateTutorChat("learner", first.id, {
    title: "Reading practice",
    contextNotes: "Explain in simple English.",
    windowTokens: 2000,
    draft: "Can you give an example?",
  });
  const restored = await readTutorChat("learner", first.id);
  assert.equal(restored.chat.title, "Reading practice");
  assert.equal(restored.chat.draft, "Can you give an example?");
  assert.equal(restored.chat.window_tokens, 2000);
  const b = await prepareTutorTurn(
    "learner",
    first.id,
    "Can you give an example?",
  );
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
  await finishTutorTurn("learner", b, "Here is an example.");
  assert.equal((await readTutorChat("learner", first.id)).messages.length, 4);
  assert.equal((await readTutorChat("learner", first.id)).chat.draft, "");
  const clean = await prepareTutorTurn(
    "learner",
    second.id,
    "A different topic",
  );
  assert.deepEqual(clean.history, []);
  await releaseTutorTurn("learner", clean);
  await assert.rejects(async () => await readTutorChat("other", first.id));
  await assert.rejects(
    async () => await updateTutorChat("other", first.id, { draft: "injected" }),
  );
  await assert.rejects(
    async () => await prepareTutorTurn("other", first.id, "injected"),
  );
});
test("in-flight requests serialize each chat; failures keep the draft and create no fake reply", async () => {
  const chat = await createTutorChat("learner"),
    a = await prepareTutorTurn("learner", chat.id, "Please help with grammar.");
  await assert.rejects(
    async () => await prepareTutorTurn("learner", chat.id, "Second request"),
  );
  await assert.rejects(
    async () =>
      await updateTutorChat("learner", chat.id, { draft: "Overwrite" }),
  );
  assert.equal(
    "request_token" in
      (await listTutorChats("learner")).find((c) => c.id === chat.id)!,
    false,
  );
  await releaseTutorTurn("learner", a);
  assert.equal((await readTutorChat("learner", chat.id)).messages.length, 0);
  assert.equal(
    (await readTutorChat("learner", chat.id)).chat.draft,
    "Please help with grammar.",
  );
  const next = await prepareTutorTurn("learner", chat.id, "Try again");
  await assert.rejects(
    async () => await finishTutorTurn("learner", a, "Stale answer"),
  );
  await finishTutorTurn("learner", next, "The current answer.");
  assert.equal((await readTutorChat("learner", chat.id)).messages.length, 2);
});
test("invalid memory settings are rejected and personal-data deletion cascades to chats and messages", async () => {
  const chat = await createTutorChat("learner");
  await assert.rejects(
    async () =>
      await updateTutorChat("learner", chat.id, { windowTokens: 123 }),
  );
  await assert.rejects(
    async () =>
      await updateTutorChat("learner", chat.id, {
        contextNotes: "x".repeat(2001),
      }),
  );
  await ensureUser("remove");
  const removable = await createTutorChat("remove"),
    turn = await prepareTutorTurn(
      "remove",
      removable.id,
      "Delete this test conversation later.",
    );
  await finishTutorTurn("remove", turn, "Test response.");
  await run("DELETE FROM users WHERE id=?", "remove");
  assert.equal(
    (await rows("SELECT * FROM tutor_chats WHERE user_id=?", "remove")).length,
    0,
  );
  assert.equal(
    (await rows("SELECT * FROM tutor_messages WHERE user_id=?", "remove"))
      .length,
    0,
  );
});
