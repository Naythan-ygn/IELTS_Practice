import { patterns, strategies } from "./patterns";
import { strategyQuestions } from "./strategy-bank";
import type { StrategyQuestion } from "./strategy-types";
export type Observation = {
  questionId: string;
  patternId: string;
  strategyId: string;
  skill: string;
  correct: boolean;
  seconds: number | null;
  phase: string;
  at: string;
  trap: string;
  source: string;
  fresh?: boolean;
};
export function legacyMetadata(activity: string, q: any) {
  const id =
    activity === "reading-1"
      ? "reading-tfng"
      : activity === "listening-1"
        ? "listening-short"
        : activity === "grammar-diagnostic"
          ? "grammar-accuracy"
          : "vocabulary-paraphrase";
  const pattern = patterns.find((p) => p.id === id)!;
  const evidence = q.evidence || q.explanation;
  return {
    patternId: id,
    strategyId:activity==='listening-1'?'L02':pattern.strategyId,
    skill: pattern.skill,
    evidence,
    reasoning: [
      `Compare the question with the source: ${q.text}`,
      evidence,
      `The supported answer is ${q.answer}.`,
    ],
    trap: pattern.trap,
    wrong: Object.fromEntries(
      (q.options || [])
        .filter((s: string) => s !== q.answer)
        .map((s: string) => [
          s,
          `This option fails the evidence check. ${q.explanation}`,
        ]),
    ),
    hint: pattern.locate,
    burmese:
      "အထောက်အထားကို ဖတ်ပြီး မေးခွန်းနှင့် နှိုင်းယှဉ်ပါ။ စာသားတွင် မဖော်ပြထားသော အချက်ကို မခန့်မှန်းပါနှင့်။",
  };
}
export function aggregate(observations: Observation[]) {
  return patterns.map((p) => {
    const linkedStrategyId=strategyQuestions.find(q=>q.patternId===p.id)?.strategyId||p.strategyId;
    const strategyOwn=observations.filter(o=>o.strategyId===linkedStrategyId);
    const own = observations.filter((o) => o.patternId === p.id),
      recent = own.slice(-10),
      measured = own.filter((o) => o.seconds !== null),
      independent = strategyOwn.filter(
        (o) =>
          o.source === "strategy" &&
          o.phase === "independent" &&
          o.fresh !== false,
      ),
      timed = strategyOwn.filter(
        (o) =>
          o.source === "strategy" && o.phase === "timed" && o.fresh !== false,
      );
    const uniqueInd = [
        ...new Map(
          [...independent].reverse().map((o) => [o.questionId, o]),
        ).values(),
      ],
      uniqueTimed = [
        ...new Map([...timed].reverse().map((o) => [o.questionId, o])).values(),
      ];
    const acc = (o: Observation[]) =>
      o.length
        ? Math.round((o.filter((q) => q.correct).length / o.length) * 100)
        : null;
    const master =
      uniqueInd.length >= 10 &&
      uniqueTimed.length >= 5 &&
      (acc(uniqueInd) || 0) >= 80 &&
      (acc(uniqueTimed) || 0) >= 80;
    return {
      patternId: p.id,
      available: strategyQuestions.some((q) => q.patternId === p.id),
      strategyId: linkedStrategyId,
      name: p.name,
      skill: p.skill,
      total: own.length,
      correct: own.filter((o) => o.correct).length,
      accuracy: acc(own),
      recent: acc(recent),
      averageSeconds: measured.length
        ? Math.round(
            measured.reduce((s, o) => s + (o.seconds || 0), 0) /
              measured.length,
          )
        : null,
      measuredResponses: measured.length,
      uniqueQuestions: new Set(own.map((o) => o.questionId)).size,
      independent: uniqueInd.length,
      timed: uniqueTimed.length,
      mastery: master
        ? "Mastered strategy practice"
        : uniqueInd.length
          ? "Applying"
          : own.length
            ? "Learning"
            : "Not assessed",
      confidence:
        own.length < 10
          ? "Small sample — practise more before drawing conclusions."
          : "Practice evidence; this does not establish an IELTS band.",
      commonErrors: [
        ...new Set(own.filter((o) => !o.correct).map((o) => o.trap)),
      ].slice(0, 3),
      recommendation: master
        ? "Keep a spaced review and transfer the strategy to a new full task."
        : own.length
          ? "Review missed evidence, then try fresh independent questions."
          : "Start with a worked example.",
    };
  });
}
export function explainQuestion(q: any, activity?: string) {
  const metadata = activity ? legacyMetadata(activity, q) : q;
  const strategy = strategies.find((s) => s.id === metadata.strategyId);
  return {
    correctAnswer: q.answer,
    studentAnswer: q.student || "",
    evidence: metadata.evidence,
    reasoning: metadata.reasoning,
    trap: metadata.trap,
    wrongOptions: metadata.wrong,
    strategy,
    burmese: metadata.burmese,
    followUp:
      strategyQuestions.find(
        (x) => x.strategyId === metadata.strategyId && x.id !== q.id,
      )?.id || null,
  };
}
export function scorePlan(input: any) {
  const names = ["Listening", "Reading", "Writing", "Speaking"];
  const scores: Record<string, number | null> = {},
    minimums: Record<string, number | null> = {};
  for (const name of names) {
    for (const [key, target] of [
      ["scores", scores],
      ["minimums", minimums],
    ] as const) {
      const value = input[key]?.[name];
      if (value === null || value === undefined || value === "") {
        target[name] = null;
        continue;
      }
      const n = Number(value);
      if (!Number.isFinite(n) || n < 0 || n > 9 || (n * 2) % 1 !== 0)
        throw Error("Bands must be between 0 and 9 in half-band steps.");
      target[name] = n;
    }
  }
  const target = Number(input.target);
  if (
    !Number.isFinite(target) ||
    target < 0 ||
    target > 9 ||
    (target * 2) % 1 !== 0
  )
    throw Error("Choose a valid overall target.");
  const complete = names.every((n) => scores[n] !== null);
  const average = complete
    ? names.reduce((s, n) => s + scores[n]!, 0) / 4
    : null;
  const overall = average === null ? null : Math.round(average * 2) / 2;
  const requirements = names.map((name) => ({
    name,
    score: scores[name],
    minimum: minimums[name],
    met:
      minimums[name] === null
        ? null
        : scores[name] === null
          ? null
          : scores[name]! >= minimums[name]!,
  }));
  return {
    target,
    scores,
    minimums,
    average,
    overall,
    targetMet: overall === null ? null : overall >= target,
    requirements,
    label: "User-entered planning scenario — not a recorded assessment",
    priorities: requirements
      .filter((r) => r.met === false)
      .map(
        (r) =>
          `${r.name}: below your entered section minimum. Prioritise this requirement before balancing the overall average.`,
      ),
    explanation:
      "Each of the four skills contributes equally. The average is rounded to the nearest half band; .25 rounds up to the next half and .75 to the next whole band. A qualifying overall score does not override a required section minimum.",
  };
}
