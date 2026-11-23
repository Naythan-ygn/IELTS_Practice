export const v2Titles = [
  "Diagnostic + IELTS scoring and question structure",
  "Listening: prediction, form completion and distractors",
  "Reading: True/False/Not Given and evidence",
  "Writing Task 1: overview and chart description",
  "Speaking Part 1: natural answer expansion",
  "Grammar + Vocabulary: accuracy and paraphrasing",
  "Mini checkpoint + question-type mistake analysis",
  "Listening: multiple choice, paraphrasing and answer changes",
  "Reading: matching headings and information",
  "Writing Task 2: opinion essays and argument structure",
  "Speaking Part 2: preparation and long-turn fluency",
  "Listening: map labelling, matching and notes",
  "Reading: summary completion and vocabulary",
  "Timed section checkpoints + strategy review",
  "Writing Task 1: processes, maps and comparisons",
  "Speaking Part 3: abstract opinions and explanations",
  "Reading: multiple choice, Yes/No/Not Given and elimination",
  "Listening: lectures, matching and distractors",
  "Writing Task 2: discussion and problem-solution",
  "Mixed timed practice + common error repair",
  "Full IELTS Academic Mock 1",
  "Mock analysis + targeted question-type remediation",
  "Writing intensive: Task 1 and Task 2",
  "Speaking intensive: recorded interviews",
  "Reading intensive: 60-minute section test",
  "Listening intensive: 40-question section test",
  "Full IELTS Academic Mock 2",
  "Adaptive day: lowest-performing question types",
  "Final Full IELTS Academic Mock",
  "Final strategies and test-day checklist",
];
const mapping = [
  "G01",
  "L02",
  "R01",
  "W01",
  "S01",
  "G01",
  "R01",
  "L03",
  "R03",
  "W02",
  "S01",
  "L02",
  "V01",
  "R05",
  "W01",
  "S01",
  "R05",
  "L03",
  "W02",
  "G01",
  "R05",
  "R01",
  "W02",
  "S01",
  "R05",
  "L03",
  "R05",
  "R01",
  "R05",
  "V01",
];
const focus = [
  "Grammar",
  "Listening",
  "Reading",
  "Writing",
  "Speaking",
  "Grammar",
  "Reading",
  "Listening",
  "Reading",
  "Writing",
  "Speaking",
  "Listening",
  "Reading",
  "Reading",
  "Writing",
  "Speaking",
  "Reading",
  "Listening",
  "Writing",
  "Grammar",
  "Reading",
  "Reading",
  "Writing",
  "Speaking",
  "Reading",
  "Listening",
  "Reading",
  "Reading",
  "Reading",
  "Vocabulary",
];
export const normalSchedule = [
  ["Question nature & strategy", 20],
  ["Examples & guided practice", 25],
  ["Primary independent practice", 40],
  ["Secondary skill practice", 35],
  ["Writing or speaking production", 30],
  ["Grammar & vocabulary", 20],
  ["Mistake review", 10],
] as const;
export const strategyCourse = v2Titles.map((title, i) => ({
  day: i + 1,
  title,
  skill: focus[i],
  strategyId: mapping[i],
  minutes: 180,
  concept: title,
  lesson:
    "Understand the task, locate evidence, apply a reliable method, and review the reasoning.",
  example: "A correct answer must match both the evidence and the instruction.",
  assignment:
    "Complete guided, independent and timed work; review errors and record a reflection.",
  activity: mapping[i],
  pending: [21, 25, 26, 27, 29].includes(i + 1),
  schedule:
    i === 0
      ? [
          ["Orientation", 15],
          ["Objective diagnostic", 60],
          ["Writing sample", 25],
          ["Speaking sample", 15],
          ["Diagnostic review", 35],
          ["Foundation revision", 20],
          ["Reflection", 10],
        ]
      : [21, 27, 29].includes(i + 1)
        ? [
            ["Listening", 30],
            ["Reading", 60],
            ["Writing", 60],
            ["Speaking (separate)", 14],
            ["Initial review", 16],
          ]
        : normalSchedule,
  patterns:
    i === 11
      ? ["listening-map", "listening-matching", "listening-note"]
      : i === 14
        ? ["writing1-process", "writing1-map"]
        : i === 10
          ? ["speaking-part2"]
          : i === 15
            ? ["speaking-part3"]
            : i === 16
              ? ["reading-multiple-choice", "reading-ynng"]
              : i === 18
                ? ["writing2-discussion", "writing2-problem"]
                : [],
}));
export const microBlueprints = [
  [
    "R01",
    "Keep Not Given separate from False",
    "Spot unsupported comparisons",
    "Check all, some and only",
  ],
  [
    "R03",
    "Find a paragraph’s purpose",
    "Ignore a vivid minor detail",
    "Summarise before choosing a heading",
  ],
  [
    "R05",
    "Reject unsupported causes",
    "Remove exaggerated claims",
    "Follow the relationship, not one keyword",
  ],
  [
    "L02",
    "Hear the final correction",
    "Keep categories and numbers separate",
    "Avoid the rejected alternative",
  ],
  [
    "L03",
    "Match spoken paraphrases",
    "Follow the speaker’s reason",
    "Retain the speaker’s level of certainty",
  ],
  [
    "W01",
    "Write an accurate overview",
    "Check comparative language",
    "Keep causes out of chart reports",
  ],
  [
    "W02",
    "Answer every essay instruction",
    "Develop a relevant example",
    "Keep the position clear",
  ],
  [
    "S01",
    "Answer, reason and detail",
    "Develop a connected long turn",
    "Qualify an abstract opinion",
  ],
  [
    "G01",
    "Fix agreement with the head noun",
    "Check clause structure",
    "Choose accurate complements",
  ],
  [
    "V01",
    "Preserve meaning when paraphrasing",
    "Keep claims appropriately cautious",
    "Use contextual academic vocabulary",
  ],
].flatMap(([strategyId, ...titles]) =>
  titles.map((title, index) => ({
    id: `micro-${strategyId}-${index}`,
    strategyId,
    title,
    minutes: 10,
    index,
  })),
);
