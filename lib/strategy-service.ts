import { randomUUID } from "node:crypto";
import { rows, row, run, transaction } from "./db";
import { patterns, strategies, strategyNotes } from "./patterns";
import {
  strategyQuestions,
  trapExercises,
  activeStrategyIds,
} from "./strategy-bank";
import { microBlueprints, strategyCourse } from "./strategy-course";
import {
  aggregate,
  explainQuestion,
  legacyMetadata,
  scorePlan,
  type Observation,
} from "./strategy-analytics";
import { isCorrect, approximateBand } from "./scoring";
let seeded = false;
function seed() {
  if (seeded) return;
  transaction(() => {
    for (const p of patterns)
      run(
        "INSERT OR IGNORE INTO question_types(id,skill,name,content) VALUES (?,?,?,?)",
        p.id,
        p.skill,
        p.name,
        JSON.stringify(p),
      );
    for (const s of strategies)
      run(
        "INSERT OR IGNORE INTO exam_strategies(id,question_type_id,content) VALUES (?,?,?)",
        s.id,
        s.patternId,
        JSON.stringify(s),
      );
    for (const q of strategyQuestions)
      run(
        "INSERT OR IGNORE INTO strategy_exercises(id,strategy_id,phase,content) VALUES (?,?,?,?)",
        q.id,
        q.strategyId,
        q.phase,
        JSON.stringify(q),
      );
  });
  seeded = true;
}
export function assertCoachingAllowed(user: string) {
  if (
    row(
      "SELECT id FROM attempts WHERE user_id=? AND mode=? AND submitted_at IS NULL AND deadline>?",
      user,
      "strict",
      new Date().toISOString(),
    ) ||
    row(
      "SELECT id FROM strategy_attempts WHERE user_id=? AND submitted_at IS NULL AND deadline>?",
      user,
      new Date().toISOString(),
    )
  )
    throw Error(
      "Finish your timed assessment before opening coaching or starting another activity.",
    );
}
function present(a: Record<string, any>): Record<string, any> {
  const { snapshot, ...rest } = a;
  const snap = JSON.parse(snapshot);
  return {
    ...rest,
    answers: JSON.parse(a.answers),
    timings: JSON.parse(a.timings),
    result: a.result ? JSON.parse(a.result) : null,
    title: snap.title,
    questions: snap.questions.map((q: any) => {
      const {
        answer,
        evidence,
        reasoning,
        wrong,
        trap,
        burmese,
        trapAnswer,
        mechanism,
        source,
        hint,
        ...publicQ
      } = q;
      return {
        ...publicQ,
        ...(q.skill === "Listening" ? {} : { source }),
        ...(a.phase === "guided" ? { hint } : {}),
      };
    }),
  };
}
export function beginStrategy(user: string, body: any) {
  seed();
  const phase = String(body.phase || "guided");
  if (!["guided", "independent", "timed", "micro", "trap"].includes(phase))
    throw Error("Invalid strategy phase.");
  const strategy = strategies.find((s) => s.id === body.strategyId);
  if (phase !== "trap" && !strategy) throw Error("Strategy not found.");
  const existing = row(
    "SELECT * FROM strategy_attempts WHERE user_id=? AND strategy_id=? AND phase=? AND day IS ? AND submitted_at IS NULL AND (? IS NULL OR json_extract(snapshot,'$.microId')=?)",
    user,
    phase === "trap" ? "TRAPS" : strategy!.id,
    phase,
    body.day === undefined ? null : Number(body.day),
    body.microId || null,
    body.microId || null,
  );
  if (existing) {
    if (existing.deadline && Date.parse(existing.deadline) <= Date.now())
      return submitStrategy(user, existing.id);
    if (!existing.deadline) assertCoachingAllowed(user);
    return present(existing);
  }
  assertCoachingAllowed(user);
  const day = body.day === undefined ? null : Number(body.day);
  if (day !== null && (!Number.isInteger(day) || day < 1 || day > 30))
    throw Error("Invalid study day.");
  let questions: any[] =
    phase === "trap"
      ? trapExercises
      : strategyQuestions.filter(
          (q) => q.strategyId === strategy!.id && q.phase === phase,
        );
  let microId: string | null = null;
  if (phase === "micro") {
    const micro = row(
      "SELECT * FROM micro_lessons WHERE id=? AND user_id=?",
      String(body.microId),
      user,
    );
    if (!micro || micro.strategy_id !== strategy!.id)
      throw Error("Micro-lesson not found.");
    const snap = JSON.parse(micro.snapshot);
    questions = snap.questions;
    microId = micro.id;
  }
  if (!questions.length)
    throw Error(
      "This question type has reference lessons; its exercise bank is pending.",
    );
  const id = randomUUID(),
    now = new Date(),
    deadline =
      phase === "timed"
        ? new Date(now.getTime() + questions.length * 60000).toISOString()
        : null;
  const snapshot = {
    title: phase === "trap" ? "Spot the Trap" : strategy!.name,
    questions,
    microId,
    version: 2,
  };
  run(
    "INSERT INTO strategy_attempts(id,user_id,strategy_id,kind,phase,day,source_attempt,started_at,deadline,snapshot) VALUES (?,?,?,?,?,?,?,?,?,?)",
    id,
    user,
    phase === "trap" ? "TRAPS" : strategy!.id,
    phase === "trap" ? "trap" : "strategy",
    phase,
    day,
    body.sourceAttempt || null,
    now.toISOString(),
    deadline,
    JSON.stringify(snapshot),
  );
  return present(row("SELECT * FROM strategy_attempts WHERE id=?", id)!);
}
export function saveStrategy(
  user: string,
  id: string,
  answers: any,
  timings: any,
) {
  const a = row(
    "SELECT * FROM strategy_attempts WHERE id=? AND user_id=?",
    id,
    user,
  );
  if (!a) throw Error("Attempt not found.");
  if (a.submitted_at) return present(a);
  if (a.deadline && Date.parse(a.deadline) <= Date.now())
    return submitStrategy(user, id);
  const snapshot = JSON.parse(a.snapshot),
    valid: Record<string, string> = {},
    times: Record<string, number> = {},
    old = JSON.parse(a.timings);
  let budget = Math.max(
    0,
    Math.floor((Date.now() - Date.parse(a.started_at)) / 1000),
  );
  for (const q of snapshot.questions) {
    for (const key of [q.id, ...(a.kind === "trap" ? [`${q.id}:trap`] : [])])
      if (typeof answers?.[key] === "string")
        valid[key] = answers[key].slice(0, 1000);
    const value = Number(timings?.[q.id]);
    const safe = Number.isFinite(value)
      ? Math.max(0, Math.min(3600, Math.floor(value)))
      : 0;
    times[q.id] = Math.min(budget, Math.max(old[q.id] || 0, safe));
    budget -= times[q.id];
  }
  run(
    "UPDATE strategy_attempts SET answers=?,timings=? WHERE id=?",
    JSON.stringify(valid),
    JSON.stringify(times),
    id,
  );
  return present(row("SELECT * FROM strategy_attempts WHERE id=?", id)!);
}
export function submitStrategy(user: string, id: string) {
  return transaction(() => {
    const a = row(
      "SELECT * FROM strategy_attempts WHERE id=? AND user_id=?",
      id,
      user,
    );
    if (!a) throw Error("Attempt not found.");
    if (a.submitted_at) return present(a);
    const snapshot = JSON.parse(a.snapshot),
      answers = JSON.parse(a.answers),
      timings = JSON.parse(a.timings);
    const review = snapshot.questions.map((q: any) => ({
      ...q,
      student: answers[q.id] || "",
      correct: isCorrect(answers[q.id] || "", q.answer),
      seconds: timings[q.id] || null,
      ...(a.kind === "trap"
        ? {
            studentTrap: answers[`${q.id}:trap`] || "",
            trapCorrect: isCorrect(answers[`${q.id}:trap`] || "", q.trapAnswer),
          }
        : {}),
    }));
    const correct = review.filter((q: any) => q.correct).length;
    const result = {
      correct,
      total: review.length,
      answered: review.filter((q: any) => q.student).length,
      accuracy: Math.round((correct / review.length) * 100),
      review,
      band: null,
      ...(a.kind === "trap"
        ? {
            trapCorrect: review.filter((q: any) => q.trapCorrect).length,
            trapAccuracy: Math.round(
              (review.filter((q: any) => q.trapCorrect).length /
                review.length) *
                100,
            ),
          }
        : {}),
      label:
        a.kind === "trap"
          ? "Trap recognition and task reasoning — separate training measures"
          : snapshot.questions.some((q: any) =>
                ["Writing", "Speaking"].includes(q.skill),
              )
            ? "Strategy knowledge only — not an assessed Writing or Speaking performance"
            : "Short strategy practice — not an IELTS band",
    };
    run(
      "UPDATE strategy_attempts SET submitted_at=?,result=? WHERE id=?",
      new Date().toISOString(),
      JSON.stringify(result),
      id,
    );
    for (const q of review.filter(
      (q: any) => !q.correct || (a.kind === "trap" && !q.trapCorrect),
    )) {
      const trapOnly = q.correct && a.kind === "trap";
      run(
        "INSERT INTO mistakes(id,user_id,question_id,activity_id,question,answer,correction,explanation,category,due,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(user_id,activity_id,question_id) DO UPDATE SET answer=excluded.answer,repetitions=repetitions+1,status='Learning',due=excluded.due",
        randomUUID(),
        user,
        q.id,
        `strategy:${q.strategyId}`,
        q.text || q.question,
        trapOnly ? q.studentTrap : q.student,
        trapOnly ? q.trapAnswer : q.answer,
        q.evidence || q.mechanism,
        `${q.skill}: ${q.trap || q.trapAnswer}`,
        new Date().toISOString(),
        new Date().toISOString(),
      );
    }
    return present(row("SELECT * FROM strategy_attempts WHERE id=?", id)!);
  });
}
export function observations(user: string): Observation[] {
  const result: Observation[] = [];
  const legacyTimes = new Map(
    rows("SELECT * FROM question_timings WHERE user_id=?", user).map((t) => [
      t.attempt_id,
      JSON.parse(t.data),
    ]),
  );
  for (const a of rows(
    "SELECT * FROM attempts WHERE user_id=? AND submitted_at IS NOT NULL ORDER BY submitted_at",
    user,
  )) {
    for (const q of JSON.parse(a.result).review) {
      const m = legacyMetadata(a.activity_id, q);
      result.push({
        questionId: q.id,
        patternId: m.patternId,
        strategyId: m.strategyId,
        skill: m.skill,
        correct: q.correct,
        seconds: legacyTimes.get(a.id)?.[q.id] ?? null,
        phase: a.mode,
        at: a.submitted_at,
        trap: m.trap,
        source: "legacy",
      });
    }
  }
  for (const a of rows(
    "SELECT * FROM strategy_attempts WHERE user_id=? AND kind=? AND submitted_at IS NOT NULL ORDER BY submitted_at",
    user,
    "strategy",
  )) {
    for (const q of JSON.parse(a.result).review)
      result.push({
        questionId: q.id,
        patternId: q.patternId,
        strategyId: q.strategyId,
        skill: q.skill,
        correct: q.correct,
        seconds: q.seconds,
        phase: a.phase,
        at: a.submitted_at,
        trap: q.trap,
        source: a.phase === "micro" ? "micro" : "strategy",
      });
  }
  const seen = new Set<string>();
  return result
    .sort((a, b) => a.at.localeCompare(b.at))
    .map((o) => {
      const key = `${o.strategyId}:${o.questionId}`;
      const fresh = !seen.has(key);
      seen.add(key);
      return { ...o, fresh };
    });
}
export function strategyState(user: string) {
  seed();
  for (const a of rows(
    "SELECT id FROM strategy_attempts WHERE user_id=? AND submitted_at IS NULL AND deadline IS NOT NULL AND deadline<=?",
    user,
    new Date().toISOString(),
  ))
    submitStrategy(user, a.id);
  const obs = observations(user);
  const byType = aggregate(obs);
  return {
    analytics: byType,
    attempts: rows(
      "SELECT * FROM strategy_attempts WHERE user_id=? ORDER BY started_at DESC",
      user,
    ).map(present),
    progress: rows("SELECT * FROM strategy_progress WHERE user_id=?", user),
    lessonProgress: rows(
      "SELECT * FROM course_progress_v2 WHERE user_id=?",
      user,
    ),
    micros: rows(
      "SELECT id,strategy_id,title,reason,source_attempt,created_at FROM micro_lessons WHERE user_id=? ORDER BY created_at DESC",
      user,
    ),
    scenarios: rows(
      "SELECT * FROM score_planning_scenarios WHERE user_id=? ORDER BY created_at DESC",
      user,
    ).map((s) => ({ ...s, data: JSON.parse(s.data) })),
    coaching: rows(
      "SELECT * FROM coaching_responses WHERE user_id=? ORDER BY updated_at DESC",
      user,
    ).map((s) => ({ ...s, feedback: JSON.parse(s.feedback) })),
    trapSummary: rows(
      "SELECT result FROM strategy_attempts WHERE user_id=? AND kind=? AND submitted_at IS NOT NULL",
      user,
      "trap",
    ).reduce(
      (s, a) => {
        const r = JSON.parse(a.result);
        return {
          questions: s.questions + r.total,
          recognised: s.recognised + r.trapCorrect,
          answeredCorrectly: s.answeredCorrectly + r.correct,
        };
      },
      { questions: 0, recognised: 0, answeredCorrectly: 0 },
    ),
  };
}
export function catalog() {
  return {
    patterns: patterns.map((p) => ({
      ...p,
      practiceAvailable: activeStrategyIds.includes(p.strategyId),
    })),
    strategies: strategies.map((s) => ({
      ...s,
      practiceAvailable: activeStrategyIds.includes(s.id),
    })),
    notes: strategyNotes,
    course: strategyCourse,
    microBlueprints: microBlueprints.map(
      ({ id, strategyId, title, minutes }) => ({
        id,
        strategyId,
        title,
        minutes,
      }),
    ),
    coverage: {
      referenceTypes: patterns.length,
      activeStrategies: activeStrategyIds.length,
      practiceQuestions: strategyQuestions.length,
      trapScenarios: trapExercises.length,
      microBlueprints: microBlueprints.length,
    },
  };
}
export function explanation(
  user: string,
  id: string,
  questionId: string,
  legacy = false,
) {
  const a = row(
    `SELECT * FROM ${legacy ? "attempts" : "strategy_attempts"} WHERE id=? AND user_id=?`,
    id,
    user,
  );
  if (!a || !a.submitted_at)
    throw Error(
      "Explanations unlock only after your owned attempt is submitted.",
    );
  const q = JSON.parse(a.result).review.find((q: any) => q.id === questionId);
  if (!q) throw Error("Question not found.");
  if (a.kind === "trap")
    return {
      correctAnswer: q.answer,
      studentAnswer: q.student,
      evidence: q.source,
      reasoning: [q.mechanism],
      trap: q.trapAnswer,
      wrongOptions: {},
      strategy: strategies.find((s) => s.id === q.strategyId),
      burmese: "မေးခွန်း၏ လှည့်ကွက်နှင့် အထောက်အထားကို သီးခြားစစ်ဆေးပါ။",
      followUp: strategyQuestions.find((x) => x.strategyId === q.strategyId)
        ?.id,
    };
  return explainQuestion(q, legacy ? a.activity_id : undefined);
}
export function generateMicro(user: string, sourceAttempt?: string) {
  assertCoachingAllowed(user);
  const all = observations(user);
  let missed = all.filter((o) => !o.correct);
  if (sourceAttempt) {
    const legacy = row(
        "SELECT * FROM attempts WHERE id=? AND user_id=? AND submitted_at IS NOT NULL",
        sourceAttempt,
        user,
      ),
      modern = row(
        "SELECT * FROM strategy_attempts WHERE id=? AND user_id=? AND submitted_at IS NOT NULL",
        sourceAttempt,
        user,
      );
    if (!legacy && !modern)
      throw Error("Submit an owned source attempt first.");
    const ids = new Set(
      JSON.parse((legacy || modern)!.result)
        .review.filter((q: any) => !q.correct)
        .map((q: any) => q.id),
    );
    missed = missed.filter((o) => ids.has(o.questionId));
    if (modern?.kind === "trap")
      missed = JSON.parse(modern.result)
        .review.filter((q: any) => !q.correct || !q.trapCorrect)
        .map((q: any) => ({
          questionId: q.id,
          patternId:
            patterns.find((p) => p.strategyId === q.strategyId)?.id || "trap",
          strategyId: q.strategyId,
          skill: q.skill,
          correct: false,
          seconds: q.seconds,
          phase: "trap",
          at: modern.submitted_at,
          trap: q.trapAnswer,
          source: "trap",
        }));
  }
  if (!missed.length)
    throw Error(
      "No recorded mistakes match this source. Complete practice first.",
    );
  const counts = new Map<string, number>();
  for (const m of missed)
    counts.set(m.strategyId, (counts.get(m.strategyId) || 0) + 1);
  const already = rows(
    "SELECT strategy_id FROM micro_lessons WHERE user_id=?",
    user,
  );
  const choice = [...counts.entries()]
    .filter(([id]) => activeStrategyIds.includes(id))
    .sort((a, b) => b[1] - a[1])
    .find(([id]) => already.filter((m) => m.strategy_id === id).length < 3);
  if (!choice)
    throw Error(
      "Your focused lessons are already in the review queue. Revisit them before adding more.",
    );
  const [strategyId, count] = choice,
    index = already.filter((m) => m.strategy_id === strategyId).length,
    blueprint = microBlueprints.find(
      (b) => b.strategyId === strategyId && b.index === index,
    )!,
    pattern = patterns.find((p) => p.strategyId === strategyId)!;
  const candidates = strategyQuestions.filter(
    (q) => q.strategyId === strategyId,
  );
  const practice = candidates.slice(index * 5, index * 5 + 3),
    check = candidates.slice(index * 5 + 3, index * 5 + 5);
  const questions = [...practice, ...check].map((q, i) => ({
    ...q,
    microStage: i < 3 ? "Practice" : "Mastery check",
  }));
  const id = randomUUID(),
    reason = `Selected from ${count} recorded error${count === 1 ? "" : "s"} in ${pattern.name}; repeated errors increase revision priority.`;
  run(
    "INSERT INTO micro_lessons(id,user_id,strategy_id,title,reason,source_attempt,snapshot,created_at) VALUES (?,?,?,?,?,?,?,?)",
    id,
    user,
    strategyId,
    blueprint.title,
    reason,
    sourceAttempt || null,
    JSON.stringify({
      explanation: pattern.locate,
      examples: pattern.examples,
      questions,
    }),
    new Date().toISOString(),
  );
  return { id, strategyId, title: blueprint.title, reason };
}
export function getMicro(user: string, id: string) {
  const m = row(
    "SELECT * FROM micro_lessons WHERE id=? AND user_id=?",
    id,
    user,
  );
  if (!m) throw Error("Micro-lesson not found.");
  const { questions, ...lesson } = JSON.parse(m.snapshot);
  return { ...m, snapshot: undefined, lesson };
}
export function lessonStep(
  user: string,
  day: number,
  stage: string,
  body: string,
) {
  assertCoachingAllowed(user);
  if (
    !Number.isInteger(day) ||
    day < 1 ||
    day > 30 ||
    ![
      "learn",
      "decode",
      "demonstrate",
      "review",
      "revision",
      "reflection",
      "complete",
    ].includes(stage)
  )
    throw Error("Invalid lesson stage.");
  if (stage === "complete") {
    const l = strategyCourse[day - 1];
    if (l.pending)
      throw Error(
        "The required full assessment is pending; this day cannot be completed.",
      );
    for (const required of [
      "learn",
      "decode",
      "demonstrate",
      "review",
      "revision",
    ])
      if (
        !row(
          "SELECT day FROM course_progress_v2 WHERE user_id=? AND day=? AND stage=?",
          user,
          day,
          required,
        )
      )
        throw Error("Complete the lesson path and review before finishing.");
    if (body.trim().length < 20)
      throw Error("Write a reflection of at least 20 characters.");
    for (const phase of ["guided", "independent", "timed"]) {
      const a = rows(
        "SELECT result FROM strategy_attempts WHERE user_id=? AND strategy_id=? AND day=? AND phase=? AND submitted_at IS NOT NULL",
        user,
        l.strategyId,
        day,
        phase,
      ).map((x) => JSON.parse(x.result));
      if (!a.some((r) => r.answered === r.total))
        throw Error(`Complete all questions in ${phase} practice.`);
    }
    for (const foundation of ["G01", "V01"])
      if (
        !row(
          "SELECT id FROM strategy_attempts WHERE user_id=? AND day=? AND strategy_id=? AND submitted_at IS NOT NULL AND json_extract(result,'$.answered')=json_extract(result,'$.total')",
          user,
          day,
          foundation,
        )
      )
        throw Error(
          "Complete both grammar and vocabulary foundation practice for this day.",
        );
    const secondary = l.skill === "Reading" ? "Listening" : "Reading";
    if (
      !row(
        "SELECT id FROM attempts WHERE user_id=? AND day=? AND skill=? AND submitted_at IS NOT NULL AND json_extract(result,'$.answered')=json_extract(result,'$.total')",
        user,
        day,
        secondary,
      )
    )
      throw Error("Complete the secondary-skill practice for this day.");
    if (
      !row(
        "SELECT id FROM writing WHERE user_id=? AND day=? AND submitted_at IS NOT NULL",
        user,
        day,
      ) &&
      !row(
        "SELECT id FROM recordings WHERE user_id=? AND day=? AND duration>=20",
        user,
        day,
      )
    )
      throw Error(
        "Add a submitted writing response or a 20-second speaking recording for this day.",
      );
    if (day === 1) {
      for (const activity of [
        "grammar-diagnostic",
        "vocabulary-diagnostic",
        "reading-1",
        "listening-1",
      ])
        if (
          !row(
            "SELECT id FROM attempts WHERE user_id=? AND activity_id=? AND submitted_at IS NOT NULL AND json_extract(result,'$.answered')=json_extract(result,'$.total')",
            user,
            activity,
          )
        )
          throw Error("Finish all four objective diagnostic components first.");
      if (
        !row(
          "SELECT id FROM writing WHERE user_id=? AND submitted_at IS NOT NULL",
          user,
        ) ||
        !row("SELECT id FROM recordings WHERE user_id=? AND duration>=20", user)
      )
        throw Error("Finish both diagnostic production components first.");
    }
  } else if (body.trim().length < 10)
    throw Error("Add a short note showing what you learned.");
  run(
    "INSERT INTO course_progress_v2(user_id,day,stage,body,updated_at) VALUES (?,?,?,?,?) ON CONFLICT(user_id,day,stage) DO UPDATE SET body=excluded.body,updated_at=excluded.updated_at",
    user,
    day,
    stage,
    body.trim().slice(0, 5000),
    new Date().toISOString(),
  );
  return { ok: true };
}
export function saveScenario(user: string, input: any) {
  const result = scorePlan(input);
  const raw = input.raw || {};
  for (const skill of ["Listening", "Reading"] as const)
    if (raw[skill] !== undefined && raw[skill] !== "") {
      const n = Number(raw[skill]);
      if (!Number.isInteger(n) || n < 0 || n > 40)
        throw Error("Raw marks must be whole numbers from 0 to 40.");
      (result as any).rawConversions ??= {};
      (result as any).rawConversions[skill] = {
        correct: n,
        total: 40,
        band: approximateBand(skill, n, 40),
        label:
          "Approximate conversion; thresholds can vary by form. It does not overwrite entered band scores.",
      };
    }
  const id = randomUUID();
  run(
    "INSERT INTO score_planning_scenarios(id,user_id,data,created_at) VALUES (?,?,?,?)",
    id,
    user,
    JSON.stringify(result),
    new Date().toISOString(),
  );
  return { id, ...result };
}
export function strategyReport(user: string, id: string, legacy: boolean) {
  const a = row(
    `SELECT * FROM ${legacy ? "attempts" : "strategy_attempts"} WHERE id=? AND user_id=?`,
    id,
    user,
  );
  if (!a || !a.submitted_at)
    throw Error("Submit an owned attempt before requesting a strategy report.");
  const result = JSON.parse(a.result),
    grouped: Record<string, { name: string; correct: number; total: number }> =
      {};
  for (const q of result.review) {
    const m = legacy ? legacyMetadata(a.activity_id, q) : q;
    const p = patterns.find((p) => p.id === m.patternId);
    const key = p?.id || q.strategyId || "trap";
    grouped[key] ??= {
      name: p?.name || "Trap recognition",
      correct: 0,
      total: 0,
    };
    grouped[key].total++;
    if (q.correct) grouped[key].correct++;
  }
  const missed = result.review.filter((q: any) => !q.correct);
  return {
    title:
      legacy && a.mode === "strict"
        ? "Checkpoint Strategy Report"
        : "Practice Strategy Report",
    label: "Short practice evidence — not a full mock result",
    correct: result.correct,
    total: result.total,
    band: result.band || null,
    types: Object.values(grouped),
    mistakes: missed.map((q: any) => ({
      question: q.text || q.question,
      student: q.student,
      answer: q.answer,
      explanation: q.explanation || q.evidence || q.mechanism,
    })),
    unanswered: result.total - result.answered,
    timeManagement: a.deadline
      ? "This timed attempt used a server deadline. Per-question focus time, where available, is an approximation."
      : "No strict timer was enforced in this practice.",
    success:
      "Correct answers are consistent with understanding these question patterns. The strategy you actually used was not directly observed.",
    recommendation: missed.length
      ? "Review the deciding evidence and build a targeted micro-lesson. Keep the source result unchanged."
      : "Retain a spaced review and transfer the method to a new full task.",
    nextDay:
      "Keep the core syllabus. Add 10 minutes of question-type revision within the next day’s review allocation.",
  };
}
export function saveLegacyTiming(user: string, id: string, times: any) {
  const a = row("SELECT * FROM attempts WHERE id=? AND user_id=?", id, user);
  if (!a) throw Error("Attempt not found.");
  if (a.submitted_at) return { ok: true };
  const questions = JSON.parse(a.snapshot).questions,
    valid: Record<string, number> = {},
    previous = JSON.parse(
      row(
        "SELECT data FROM question_timings WHERE attempt_id=? AND user_id=?",
        id,
        user,
      )?.data || "{}",
    );
  let budget = Math.floor((Date.now() - Date.parse(a.started_at)) / 1000);
  for (const q of questions) {
    const t = Number(times?.[q.id]);
    valid[q.id] = Math.min(
      Math.max(0, budget),
      Math.max(
        previous[q.id] || 0,
        Number.isFinite(t) ? Math.floor(Math.max(0, t)) : 0,
      ),
    );
    budget -= valid[q.id];
  }
  run(
    "INSERT INTO question_timings(user_id,attempt_id,data) VALUES (?,?,?) ON CONFLICT(user_id,attempt_id) DO UPDATE SET data=excluded.data",
    user,
    id,
    JSON.stringify(valid),
  );
  return { ok: true };
}
