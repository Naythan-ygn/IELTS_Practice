export type StrategySkill =
  "Listening" | "Reading" | "Writing" | "Speaking" | "Grammar" | "Vocabulary";
export type WorkedExample = {
  source: string;
  question: string;
  answer: string;
  steps: string[];
  audio?: string;
  visual?: Visual;
};
export type Visual = {
  kind:
    | "bar"
    | "line"
    | "pie"
    | "table"
    | "map"
    | "process"
    | "mixed"
    | "plan"
    | "diagram";
  title: string;
  rows: { label: string; before: number; after: number }[];
  labels?: string[];
};
export type Pattern = {
  id: string;
  name: string;
  skill: StrategySkill;
  purpose: string;
  assesses: string;
  appearance: string;
  locate: string;
  wording: string;
  trap: string;
  beginner: string;
  steps: string[];
  timing: string;
  advice: string;
  examples: WorkedExample[];
  strategyId: string;
};
export type Strategy = {
  id: string;
  name: string;
  skill: StrategySkill;
  category: string;
  patternId: string;
  explanation: string;
  when: string;
  limits: string;
  steps: string[];
  tags: string[];
  minutes: number;
};
export type StrategyQuestion = {
  id: string;
  patternId: string;
  strategyId: string;
  skill: StrategySkill;
  phase: "guided" | "independent" | "timed";
  source: string;
  text: string;
  options: string[];
  answer: string;
  evidence: string;
  reasoning: string[];
  wrong: Record<string, string>;
  trap: string;
  hint: string;
  burmese: string;
  audio?: string;
  visual?: Visual;
};
export type TrapExercise = {
  id: string;
  skill: StrategySkill;
  source: string;
  question: string;
  options: string[];
  answer: string;
  trapOptions: string[];
  trapAnswer: string;
  mechanism: string;
  strategyId: string;
  audio?: string;
  visual?: Visual;
};
