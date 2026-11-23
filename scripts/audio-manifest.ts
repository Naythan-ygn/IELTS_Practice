import { patterns } from "../lib/patterns.ts";
import { strategyQuestions } from "../lib/strategy-bank.ts";
import { writeFileSync } from "node:fs";
const assets = [
  ...patterns.flatMap((p) =>
    p.examples
      .filter((e) => e.audio)
      .map((e) => ({ path: e.audio!, text: e.source })),
  ),
  ...strategyQuestions
    .filter((q) => q.audio)
    .map((q) => ({ path: q.audio!, text: q.source })),
];
writeFileSync("scripts/audio-sources.json", JSON.stringify(assets, null, 2));
console.log(`${assets.length} aligned audio scripts prepared.`);
