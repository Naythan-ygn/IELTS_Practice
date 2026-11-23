import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import { strategyQuestions, trapExercises } from "../lib/strategy-bank.ts";
const base = process.env.TEST_BASE_URL || "http://127.0.0.1:3000";
test(
  "V2 HTTP flow: learn, resume, grade, explain, target mistakes, time, trap and plan",
  { skip: !process.env.TEST_INTEGRATION },
  async () => {
    let cookie = "";
    async function api(path: string, body?: unknown, method?: string) {
      const response = await fetch(base + path, {
        method: method || (body ? "POST" : "GET"),
        headers: {
          "Content-Type": "application/json",
          origin: base,
          ...(cookie ? { cookie } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      if (response.headers.get("set-cookie"))
        cookie = response.headers.get("set-cookie")!.split(";")[0];
      const result = await response.json();
      return { status: response.status, body: result };
    }
    const call = (b: unknown) => api("/api/strategy", b);
    assert.equal(
      (await api("/api/auth/login", { username: "TTH", password: "9834" }))
        .status,
      200,
    );
    let boot = await api("/api/state");
    assert.equal(boot.status, 200, JSON.stringify(boot.body));
    assert.equal(
      boot.body.strategy.analytics.every((a: any) => a.total === 0),
      true,
    );
    const catalog = await api("/api/strategy");
    assert.equal(catalog.body.catalog.coverage.referenceTypes, 42);
    assert.equal(catalog.body.catalog.coverage.practiceQuestions, 200);
    assert.ok(!JSON.stringify(catalog.body.catalog).includes('"wrong":'));
    let a = await call({
      action: "begin",
      strategyId: "R01",
      phase: "guided",
      day: 3,
    });
    assert.equal(a.status, 200, JSON.stringify(a.body));
    const originalId = a.body.id;
    assert.ok(a.body.questions[0].hint);
    assert.ok(!("answer" in a.body.questions[0]));
    let e = await api(
      `/api/strategy?explain=1&attempt=${originalId}&question=R01-1`,
    );
    assert.equal(e.status, 400);
    await call({
      action: "save",
      id: originalId,
      answers: { "R01-1": "False" },
      timings: {},
    });
    a = await call({
      action: "begin",
      strategyId: "R01",
      phase: "guided",
      day: 3,
    });
    assert.equal(a.body.id, originalId);
    assert.equal(a.body.answers["R01-1"], "False");
    a = await call({ action: "submit", id: originalId });
    assert.equal(a.body.result.correct, 0);
    const immutable = JSON.stringify(a.body.result);
    e = await api(
      `/api/strategy?explain=1&attempt=${originalId}&question=R01-1`,
    );
    assert.equal(e.status, 200);
    assert.ok(e.body.evidence && e.body.reasoning.length === 3);
    const report = await api(`/api/strategy?report=1&attempt=${originalId}`);
    assert.equal(report.body.types[0].total, 5);
    let micro = await call({ action: "micro", sourceAttempt: originalId });
    assert.equal(micro.status, 200, JSON.stringify(micro.body));
    const detail = await api("/api/strategy?micro=" + micro.body.id);
    assert.equal(detail.body.lesson.examples.length, 2);
    const resumed = await api("/api/state");
    assert.equal(
      JSON.stringify(
        resumed.body.strategy.attempts.find((a: any) => a.id === originalId)
          .result,
      ),
      immutable,
    );
    assert.equal(resumed.body.strategy.micros.length, 1);
    a = await call({
      action: "begin",
      strategyId: "L02",
      phase: "timed",
      day: 2,
    });
    const timedId = a.body.id;
    assert.ok(a.body.deadline);
    assert.ok(!("hint" in a.body.questions[0]));
    assert.ok(!("source" in a.body.questions[0]));
    e = await api(
      `/api/strategy?explain=1&attempt=${originalId}&question=R01-1`,
    );
    assert.equal(
      e.status,
      400,
      "Coaching must be blocked during a timed challenge.",
    );
    const testDb = new DatabaseSync(
      path.join(
        process.env.DATA_DIR || path.join(process.cwd(), "data"),
        "sprint.sqlite",
      ),
    );
    testDb
      .prepare("UPDATE strategy_attempts SET deadline=? WHERE id=?")
      .run(new Date(Date.now() - 1000).toISOString(), timedId);
    testDb.close();
    a = await call({
      action: "save",
      id: timedId,
      answers: {
        "L02-16": strategyQuestions.find((q) => q.id === "L02-16")!.answer,
      },
      timings: {},
    });
    assert.ok(a.body.submitted_at);
    assert.equal(a.body.result.correct, 0);
    const preTrap = await api("/api/state");
    a = await call({ action: "begin", strategyId: "TRAPS", phase: "trap" });
    const trapId = a.body.id;
    const trapAnswers = Object.fromEntries(
      trapExercises.flatMap((q) => [
        [q.id, q.answer],
        [q.id + ":trap", q.trapAnswer],
      ]),
    );
    await call({
      action: "save",
      id: trapId,
      answers: trapAnswers,
      timings: {},
    });
    a = await call({ action: "submit", id: trapId });
    assert.equal(a.body.result.trapAccuracy, 100);
    const postTrap = await api("/api/state");
    assert.equal(
      postTrap.body.strategy.analytics.reduce(
        (s: number, a: any) => s + a.total,
        0,
      ),
      preTrap.body.strategy.analytics.reduce(
        (s: number, a: any) => s + a.total,
        0,
      ),
    );
    const plan = await call({
      action: "score",
      scenario: {
        target: 6.5,
        scores: { Listening: 7, Reading: 7, Writing: 6, Speaking: 6 },
        minimums: { Writing: 6.5 },
        raw: { Listening: 30 },
      },
    });
    assert.equal(plan.body.overall, 6.5);
    assert.equal(
      plan.body.requirements.find((r: any) => r.name === "Writing").met,
      false,
    );
    const coach = await call({
      action: "coach",
      mode: "Thesis Trainer",
      prompt: "Transport investment",
      original: "I largely agree that public transport deserves priority.",
      revision:
        "I largely agree, although essential road maintenance should continue.",
      reason: "I qualified the position while keeping my main view.",
    });
    assert.equal(coach.status, 200, JSON.stringify(coach.body));
    const final = await api("/api/state");
    assert.equal(
      final.body.strategy.coaching[0].reason,
      "I qualified the position while keeping my main view.",
    );
    assert.equal(final.body.strategy.scenarios.length, 1);
    assert.equal(
      final.body.attempts.length,
      0,
      "Strategy work must not create or overwrite original exam attempts.",
    );
    const unowned = await fetch(
      base + `/api/strategy?explain=1&attempt=${originalId}&question=R01-1`,
    );
    assert.equal(unowned.status, 401);
    await api("/api/state", undefined, "DELETE");
  },
);
