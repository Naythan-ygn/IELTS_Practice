import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { randomUUID } from "node:crypto";
process.env.DATA_DIR = path.resolve(".test-data", "unit-" + randomUUID());
const {
  ensureUser,
  state,
  saveWriting,
  startAttempt,
  saveAnswers,
  submitAttempt,
} = await import("../lib/service.ts");
const { activities } = await import("../lib/content.ts");
const { row, rows, run } = await import("../lib/db.ts");
const {
  beginStrategy,
  saveStrategy,
  submitStrategy,
  strategyState,
  explanation,
  generateMicro,
  getMicro,
  lessonStep,
  saveScenario,
  observations,
} = await import("../lib/strategy-service.ts");
const { strategyQuestions, trapExercises } =
  await import("../lib/strategy-bank.ts");
const user = "strategy-test";
await ensureUser(user);
async function finish(id: string, phase: string, day = 3, wrong = false) {
  const a = await beginStrategy(user, { strategyId: id, phase, day });
  const qs = strategyQuestions.filter(
    (q) => q.strategyId === id && q.phase === phase,
  );
  const answers = Object.fromEntries(
    qs.map((q) => [
      q.id,
      wrong ? q.options.find((x) => x !== q.answer) : q.answer,
    ]),
  );
  await saveStrategy(user, a.id, answers, {});
  return await submitStrategy(user, a.id);
}
test("guided hints, answer secrecy, resume, explanations and idempotent submission", async () => {
  const a = await beginStrategy(user, {
    strategyId: "R01",
    phase: "guided",
    day: 3,
  });
  assert.equal(a.questions.length, 5);
  assert.ok(a.questions[0].hint);
  for (const q of a.questions) {
    assert.ok(!("answer" in q));
    assert.ok(!("wrong" in q));
    assert.ok(!("evidence" in q));
  }
  await assert.rejects(
    async () => await explanation(user, a.id, a.questions[0].id),
  );
  await saveStrategy(user, a.id, { "R01-1": "False" }, {});
  assert.equal(
    (await beginStrategy(user, { strategyId: "R01", phase: "guided", day: 3 }))
      .id,
    a.id,
  );
  assert.equal(
    (await beginStrategy(user, { strategyId: "R01", phase: "guided", day: 3 }))
      .answers["R01-1"],
    "False",
  );
  const r = await submitStrategy(user, a.id);
  assert.equal(r.result.correct, 0);
  assert.equal((await submitStrategy(user, a.id)).result.correct, 0);
  assert.ok((await explanation(user, a.id, "R01-1")).evidence);
  await assert.rejects(
    async () => await explanation("someone-else", a.id, "R01-1"),
  );
  assert.equal(
    (await rows("SELECT * FROM mistakes WHERE user_id=?", user)).length,
    5,
  );
});
test("micro-lessons require actual errors and contain real 3+2 questions", async () => {
  await ensureUser("empty");
  await assert.rejects(async () => await generateMicro("empty"));
  const micro = await generateMicro(user);
  assert.equal(micro.strategyId, "R01");
  const lesson = await getMicro(user, micro.id);
  assert.equal(lesson.lesson.examples.length, 2);
  assert.ok(!("questions" in lesson.lesson));
  const a = await beginStrategy(user, {
    strategyId: "R01",
    phase: "micro",
    microId: micro.id,
    day: 3,
  });
  assert.equal(a.questions.length, 5);
  assert.equal(
    a.questions.filter((q: any) => q.microStage === "Mastery check").length,
    2,
  );
  await submitStrategy(user, a.id);
});
test("timed challenges hide hints, enforce deadline after refresh and reject late answers", async () => {
  const a = await beginStrategy(user, {
    strategyId: "L02",
    phase: "timed",
    day: 2,
  });
  assert.equal(Date.parse(a.deadline) - Date.parse(a.started_at), 300000);
  assert.ok(!("source" in a.questions[0]));
  assert.ok(a.questions[0].audio);
  assert.ok(!("hint" in a.questions[0]));
  await assert.rejects(
    async () =>
      await beginStrategy(user, { strategyId: "R03", phase: "guided", day: 9 }),
  );
  await run(
    "UPDATE strategy_attempts SET deadline=? WHERE id=?",
    new Date(Date.now() - 1000).toISOString(),
    a.id,
  );
  const r = await saveStrategy(
    user,
    a.id,
    { "L02-16": strategyQuestions.find((q) => q.id === "L02-16")!.answer },
    {},
  );
  assert.ok(r.submitted_at);
  assert.equal(r.result.correct, 0);
  assert.ok(
    (await strategyState(user)).attempts.find((x) => x.id === a.id)!
      .submitted_at,
  );
});
test("trap recognition is stored separately and excluded from normal question accuracy", async () => {
  const before = (await observations(user)).length,
    a = await beginStrategy(user, { strategyId: "TRAPS", phase: "trap" });
  const answers = Object.fromEntries(
    trapExercises.flatMap((q) => [
      [q.id, q.answer],
      [`${q.id}:trap`, q.trapAnswer],
    ]),
  );
  await saveStrategy(user, a.id, answers, {});
  const r = await submitStrategy(user, a.id);
  assert.equal(r.result.trapAccuracy, 100);
  assert.equal(r.result.accuracy, 100);
  assert.equal((await observations(user)).length, before);
});
test("mastery cannot be earned by reading and scenario inputs never create test results", async () => {
  const a = (await strategyState(user)).analytics.find(
    (a) => a.strategyId === "R01",
  )!;
  assert.notEqual(a.mastery, "Mastered strategy practice");
  const before = (await row(
    "SELECT COUNT(*) AS n FROM attempts WHERE user_id=?",
    user,
  ))!.n;
  const scenario = await saveScenario(user, {
    target: 6.5,
    scores: { Listening: 7, Reading: 7, Writing: 6, Speaking: 6 },
    minimums: { Writing: 6.5 },
    raw: { Listening: 30 },
  });
  assert.equal(scenario.overall, 6.5);
  assert.equal(
    (await row("SELECT COUNT(*) AS n FROM attempts WHERE user_id=?", user))!.n,
    before,
  );
  assert.equal((await strategyState(user)).scenarios.length, 1);
});
test("V2 completion requires saved stages, three practice phases, both foundations, secondary and production", async () => {
  await ensureUser("course-empty");
  await assert.rejects(
    async () =>
      await lessonStep(
        "course-empty",
        3,
        "complete",
        "I have completed every required activity.",
      ),
  );
  for (const stage of ["learn", "decode", "demonstrate", "review", "revision"])
    await lessonStep(
      user,
      3,
      stage,
      "I compare the full statement with the evidence.",
    );
  await finish("R01", "guided");
  await finish("R01", "independent");
  await finish("R01", "timed");
  await assert.rejects(
    async () =>
      await lessonStep(
        user,
        3,
        "complete",
        "I compare the whole proposition with its source.",
      ),
  );
  await finish("G01", "guided");
  await finish("V01", "guided");
  const listening = await startAttempt(user, "listening-1", "practice", 3);
  await saveAnswers(
    user,
    listening.id,
    Object.fromEntries(
      activities
        .find((a) => a.id === "listening-1")!
        .questions.map((q) => [q.id, q.answer]),
    ),
    0,
  );
  await submitAttempt(user, listening.id);
  await saveWriting(
    user,
    "task1-cycling",
    Array(150).fill("overview").join(" "),
    true,
    3,
  );
  await lessonStep(
    user,
    3,
    "complete",
    "I compare the whole proposition with its source and check all qualifiers.",
  );
  assert.ok(
    (await strategyState(user)).lessonProgress.some(
      (s) => s.day === 3 && s.stage === "complete",
    ),
  );
  assert.equal(
    (await state(user)).days.length,
    0,
    "V1 completion history must not be overwritten.",
  );
  await assert.rejects(
    async () =>
      await lessonStep(
        user,
        21,
        "complete",
        "This shortened activity should not complete a full mock day.",
      ),
  );
});
