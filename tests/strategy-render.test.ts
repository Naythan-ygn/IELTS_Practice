import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  QuestionDecoder,
  StrategyPlaybook,
  StrategyPractice,
} from "../components/strategy-workspace.tsx";
import { StrategyLesson } from "../components/strategy-lesson.tsx";
import {
  ScorePlanner,
  StrategyHeatmap,
} from "../components/strategy-insights.tsx";
import { WritingCoach } from "../components/writing-coach.tsx";
import { StrategyVisual } from "../components/strategy-visual.tsx";
import { catalog } from "../lib/strategy-service.ts";
import { aggregate } from "../lib/strategy-analytics.ts";
import { strategyCourse } from "../lib/strategy-course.ts";
const content = catalog(),
  data = {
    profile: { target: 6.5, hours: 3 },
    days: [],
    aiEnabled: false,
    strategy: {
      analytics: aggregate([]),
      attempts: [],
      progress: [],
      lessonProgress: [],
      micros: [],
      scenarios: [],
      coaching: [],
    },
  };
test("decoder, playbook, heatmap, planner and lesson views render without fabricated performance", () => {
  const decoder = renderToStaticMarkup(
    React.createElement(QuestionDecoder, { catalog: content, data }),
  );
  assert.ok(
    decoder.includes("Question Decoder") ||
      decoder.includes("IELTS QUESTION DECODER"),
  );
  assert.ok(decoder.includes("True / False / Not Given"));
  assert.ok(decoder.includes("Practice pending"));
  const playbook = renderToStaticMarkup(
    React.createElement(StrategyPlaybook, { catalog: content, data }),
  );
  assert.ok(playbook.includes("Not assessed"));
  assert.ok(playbook.includes("Band 6.5") || playbook.includes("BAND 6.5"));
  const heatmap = renderToStaticMarkup(
    React.createElement(StrategyHeatmap, { data }),
  );
  assert.ok(heatmap.includes("Not assessed"));
  const planner = renderToStaticMarkup(
    React.createElement(ScorePlanner, { data }),
  );
  assert.ok(planner.includes("Planning inputs"));
  const lesson = renderToStaticMarkup(
    React.createElement(StrategyLesson, {
      lesson: strategyCourse[2],
      catalog: content,
      data,
    }),
  );
  assert.ok(lesson.includes("Your 180-minute plan"));
  assert.ok(lesson.includes("Demonstrate"));
});
test("writing coach renders seven modes and original/revision editors with honest offline feedback", () => {
  const html = renderToStaticMarkup(
    React.createElement(WritingCoach, { data }),
  );
  for (const mode of [
    "Essay Planning",
    "Introduction Builder",
    "Thesis Trainer",
    "Paragraph Development",
    "Grammar Correction",
    "Full Timed Essay",
    "Rewrite &amp; Improve",
  ])
    assert.ok(html.includes(mode), mode);
  assert.ok(html.includes("Your original"));
  assert.ok(html.includes("Your suggested revision"));
  assert.ok(html.includes("server AI connection"));
});
test("all worked visual stimuli can be rendered with labels and accessible data", () => {
  for (const p of content.patterns)
    for (const e of p.examples)
      if (e.visual) {
        const html = renderToStaticMarkup(
          React.createElement(StrategyVisual, { visual: e.visual }),
        );
        assert.ok(html.includes("<figure"));
        assert.ok(html.includes(e.visual.title.replaceAll("&", "&amp;")));
      }
});
test("strict strategy player has no hint controls or hidden transcript in its rendered HTML", () => {
  const initial = {
    id: "render-timed",
    kind: "strategy",
    phase: "timed",
    title: "Timed practice",
    deadline: new Date(Date.now() + 300000).toISOString(),
    answers: {},
    timings: {},
    questions: [
      {
        id: "L02-16",
        skill: "Listening",
        text: "Where is the bus stop?",
        options: ["Beside it", "Opposite it"],
        audio: "/audio/strategy/L02-16.wav",
      },
    ],
  };
  const html = renderToStaticMarkup(
    React.createElement(StrategyPractice, { initial }),
  );
  assert.ok(html.includes("remaining"));
  assert.ok(!html.includes("Show a guided hint"));
  assert.ok(!html.includes("The bus stop is beside the bank."));
});
