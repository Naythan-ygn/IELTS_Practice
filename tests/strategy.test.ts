import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { patterns, strategies } from "../lib/patterns.ts";
import {
  strategyQuestions,
  trapExercises,
  activeStrategyIds,
} from "../lib/strategy-bank.ts";
import { strategyCourse, microBlueprints } from "../lib/strategy-course.ts";
import {
  aggregate,
  scorePlan,
  type Observation,
} from "../lib/strategy-analytics.ts";
test("42 decoder types have two examples and complete instructional fields", () => {
  assert.equal(patterns.length, 42);
  assert.equal(new Set(patterns.map((p) => p.id)).size, 42);
  for (const p of patterns) {
    for (const key of [
      "purpose",
      "assesses",
      "appearance",
      "locate",
      "wording",
      "trap",
      "beginner",
      "timing",
      "advice",
    ] as const)
      assert.ok(p[key].length > 15, `${p.id}: ${key}`);
    assert.equal(p.examples.length, 2);
    assert.ok(p.steps.length >= 3);
    for (const e of p.examples) {
      assert.ok(e.source && e.question && e.answer);
      assert.ok(e.steps.length >= 2);
      if (p.skill === "Listening")
        assert.ok(e.audio && existsSync("public" + e.audio));
    }
    assert.ok(strategies.some((s) => s.id === p.strategyId));
  }
});
test("200 verified questions: disjoint 5 guided / 10 independent / 5 timed per active path", () => {
  assert.equal(strategyQuestions.length, 200);
  assert.equal(activeStrategyIds.length, 10);
  const ids = new Set<string>(),
    prompts = new Set<string>();
  for (const q of strategyQuestions) {
    assert.ok(!ids.has(q.id));
    ids.add(q.id);
    assert.ok(!prompts.has(q.source + "|" + q.text));
    prompts.add(q.source + "|" + q.text);
    assert.ok(q.options.includes(q.answer));
    assert.equal(new Set(q.options).size, q.options.length);
    assert.equal(Object.keys(q.wrong).length, q.options.length - 1);
    assert.ok(q.reasoning.length >= 3 && q.evidence.length > 5);
    assert.ok(patterns.some((p) => p.id === q.patternId));
    if (q.skill === "Listening") {
      assert.ok(q.audio);
      const b = readFileSync("public" + q.audio);
      assert.equal(b.subarray(0, 4).toString(), "RIFF");
      assert.ok(b.length > 10000);
    }
    if (q.strategyId === "W01") assert.ok(q.visual);
  }
  for (const id of activeStrategyIds) {
    assert.equal(
      strategyQuestions.filter(
        (q) => q.strategyId === id && q.phase === "guided",
      ).length,
      5,
    );
    assert.equal(
      strategyQuestions.filter(
        (q) => q.strategyId === id && q.phase === "independent",
      ).length,
      10,
    );
    assert.equal(
      strategyQuestions.filter(
        (q) => q.strategyId === id && q.phase === "timed",
      ).length,
      5,
    );
  }
});
test("trap scenarios and micro blueprints have valid references", () => {
  assert.equal(trapExercises.length, 24);
  assert.equal(microBlueprints.length, 30);
  for (const t of trapExercises) {
    assert.ok(t.options.includes(t.answer));
    assert.ok(t.trapOptions.includes(t.trapAnswer));
    assert.ok(t.mechanism.length > 25);
    if (t.skill === "Listening")
      assert.ok(t.audio && existsSync("public" + t.audio));
  }
  for (const m of microBlueprints)
    assert.ok(activeStrategyIds.includes(m.strategyId));
});
test("all 30 schedules sum to 180 minutes and unavailable full tests remain pending", () => {
  assert.equal(strategyCourse.length, 30);
  for (const d of strategyCourse)
    assert.equal(
      d.schedule.reduce((s, [, n]) => s + Number(n), 0),
      180,
    );
  for (const day of [21, 25, 26, 27, 29])
    assert.equal(strategyCourse[day - 1].pending, true);
});
test("planner requires four scores, rounds quarters, checks minimums, and rejects invalid data", () => {
  const scores = { Listening: 7, Reading: 7, Writing: 6, Speaking: 6 };
  assert.equal(scorePlan({ target: 6.5, scores }).overall, 6.5);
  const quarter = scorePlan({
    target: 6.5,
    scores: { Listening: 6, Reading: 6, Writing: 6, Speaking: 7 },
    minimums: { Writing: 6.5 },
  });
  assert.equal(quarter.overall, 6.5);
  assert.equal(
    quarter.requirements.find((r) => r.name === "Writing")!.met,
    false,
  );
  assert.equal(
    scorePlan({ target: 6.5, scores: { Listening: 7 } }).overall,
    null,
  );
  assert.throws(() => scorePlan({ target: 6.3, scores }));
  assert.throws(() =>
    scorePlan({ target: 6.5, scores: { ...scores, Reading: 10 } }),
  );
});
test("mastery requires distinct fresh independent and timed evidence; small samples stay provisional", () => {
  const base = {
    patternId: "reading-tfng",
    strategyId: "R01",
    skill: "Reading",
    correct: true,
    seconds: null,
    at: "2026-11-23T00:00:00Z",
    trap: "Scope",
    source: "strategy",
  };
  const one: Observation = { ...base, questionId: "r", phase: "independent" };
  assert.notEqual(
    aggregate(Array(50).fill(one)).find((a) => a.strategyId === "R01")!.mastery,
    "Mastered strategy practice",
  );
  const obs: Observation[] = [
    ...Array.from({ length: 10 }, (_, i) => ({
      ...base,
      questionId: "i" + i,
      phase: "independent",
    })),
    ...Array.from({ length: 5 }, (_, i) => ({
      ...base,
      questionId: "t" + i,
      phase: "timed",
    })),
  ];
  assert.equal(
    aggregate(obs).find((a) => a.strategyId === "R01")!.mastery,
    "Mastered strategy practice",
  );
  assert.notEqual(
    aggregate(obs.map((o) => ({ ...o, fresh: false }))).find(
      (a) => a.strategyId === "R01",
    )!.mastery,
    "Mastered strategy practice",
  );
  assert.equal(
    aggregate([one]).find((a) => a.strategyId === "R01")!.averageSeconds,
    null,
  );
});
test("pie examples use coherent shares and process answer words appear in the source", () => {
  for (const e of patterns.find((p) => p.id === "writing1-pie")!.examples) {
    assert.equal(
      e.visual!.rows.reduce((n, r) => n + r.before, 0),
      100,
    );
    assert.equal(
      e.visual!.rows.reduce((n, r) => n + r.after, 0),
      100,
    );
  }
  for (const e of patterns.find((p) => p.id === "reading-flow")!.examples)
    assert.ok(e.source.toLowerCase().includes(e.answer.toLowerCase()));
});
