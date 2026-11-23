import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { randomUUID } from "node:crypto";
process.env.DATA_DIR = path.resolve(".test-data", "ai-" + randomUUID());
const { ensureUser, startAttempt, saveAnswers, submitAttempt } =
  await import("../lib/service.ts");
const { reviewSubject, saveAIReview, savedAIReviews } =
  await import("../lib/ai-review.ts");
const { row, run } = await import("../lib/db.ts");
await ensureUser("ai-owner");
await ensureUser("ai-other");
test("answer analysis uses the owned submitted snapshot and cannot reveal unsubmitted answers", async () => {
  const a = await startAttempt("ai-owner", "reading-1", "practice", 3);
  await assert.rejects(
    async () => await reviewSubject("ai-owner", "legacy", a.id, "r0"),
  );
  await saveAnswers("ai-owner", a.id, { r0: "True" }, 0);
  await submitAttempt("ai-owner", a.id);
  const before = (await row("SELECT result FROM attempts WHERE id=?", a.id))!
    .result;
  const subject = await reviewSubject("ai-owner", "legacy", a.id, "r0");
  assert.ok(subject.input.includes("Urban trees"));
  assert.ok(subject.input.includes('"student":"True"'));
  assert.ok(subject.input.includes('"answer":"False"'));
  await assert.rejects(
    async () => await reviewSubject("ai-other", "legacy", a.id, "r0"),
  );
  await assert.rejects(
    async () => await reviewSubject("ai-owner", "legacy", a.id, "unknown"),
  );
  await assert.rejects(
    async () => await reviewSubject("ai-owner", "arbitrary_table", a.id),
  );
  await saveAIReview("ai-owner", "legacy", a.id, "r0", {
    answer: "Check the qualification about species.",
    provider: "OpenRouter",
    model: "test-model",
  });
  assert.equal((await savedAIReviews("ai-owner")).length, 1);
  assert.equal((await savedAIReviews("ai-other")).length, 0);
  assert.equal(
    (await row("SELECT result FROM attempts WHERE id=?", a.id))!.result,
    before,
  );
});
test("speaking feedback needs supplied text and explicitly excludes pronunciation or audio scoring", async () => {
  const id = randomUUID();
  await run(
    "INSERT INTO recordings(id,user_id,prompt,mime,file,transcript,duration,created_at) VALUES (?,?,?,?,?,?,?,?)",
    id,
    "ai-owner",
    "Do you enjoy reading?",
    "audio/webm",
    "test-only.audio",
    "",
    20,
    new Date().toISOString(),
  );
  await assert.rejects(
    async () => await reviewSubject("ai-owner", "recording", id),
  );
  await run(
    "UPDATE recordings SET transcript=? WHERE id=?",
    "I enjoy reading because it helps me learn about science.",
    id,
  );
  const subject = await reviewSubject("ai-owner", "recording", id);
  assert.ok(subject.input.includes("No audio has been sent or analysed"));
  assert.ok(subject.input.includes("Do not score pronunciation"));
  await assert.rejects(
    async () => await reviewSubject("ai-other", "recording", id),
  );
});
