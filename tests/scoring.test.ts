import test from "node:test";
import assert from "node:assert/strict";
import {
  approximateBand,
  overallBand,
  writingBand,
  isCorrect,
  wordCount,
  reviewSchedule,
} from "../lib/scoring.ts";
import { activities, course, publicActivities, words } from "../lib/content.ts";
import { readFileSync } from "node:fs";
test("IELTS conversion uses thresholds and refuses short practice extrapolation", () => {
  assert.equal(approximateBand("Reading", 30, 40), 7);
  assert.equal(approximateBand("Listening", 26, 40), 6.5);
  assert.equal(approximateBand("Reading", 27, 40), 6.5);
  assert.equal(approximateBand("Reading", 8, 10), null);
});
test("overall rounding uses all four components and half bands", () => {
  assert.equal(overallBand([6, 6.5, 6.5, 7]), 6.5);
  assert.equal(overallBand([6, 6, 6, 7]), 6.5);
  assert.equal(overallBand([6.5, 6.5, 6.5, 7.5]), 7);
  assert.equal(overallBand([7, 7, 7, null]), null);
  assert.equal(overallBand([7, 7]), null);
  assert.equal(writingBand(6, 7.5), 7);
});
test("objective answer normalization accepts case and whitespace but preserves meaning", () => {
  assert.ok(isCorrect("  Thursday  ", "thursday"));
  assert.ok(isCorrect("Not   Given", "Not Given"));
  assert.ok(!isCorrect("False", "Not Given"));
  assert.equal(wordCount("  One two\nthree. "), 3);
});
test("review scheduling expands intervals and resets difficult items", () => {
  const now = new Date("2026-11-23T00:00:00Z");
  assert.equal(reviewSchedule("again", 20, now).interval, 1);
  assert.equal(reviewSchedule("good", 4, now).interval, 8);
  assert.equal(reviewSchedule("easy", 4, now).interval, 12);
});
test("course and original banks have consistent keys and no duplicate questions", () => {
  assert.equal(course.length, 30);
  assert.equal(
    activities.find((a) => a.skill === "Grammar")!.questions.length,
    20,
  );
  assert.equal(
    activities.find((a) => a.skill === "Vocabulary")!.questions.length,
    20,
  );
  assert.equal(words.length, 20);
  const ids = new Set();
  for (const a of activities)
    for (const q of a.questions) {
      assert.ok(!ids.has(q.id));
      ids.add(q.id);
      assert.ok(q.explanation.length > 20);
      if (q.options) assert.ok(q.options.includes(q.answer));
    }
  assert.equal(ids.size, 60);
});
test("answer keys and transcripts are withheld from public practice payload", () => {
  for (const a of publicActivities()) {
    assert.ok(!("transcript" in a));
    for (const q of a.questions) {
      assert.ok(!("answer" in q));
      assert.ok(!("explanation" in q));
      assert.ok(!("evidence" in q));
    }
  }
});
test("listening has a real non-empty WAV asset", () => {
  const wav = readFileSync(
    new URL("../public/audio/workshop.wav", import.meta.url),
  );
  assert.equal(wav.subarray(0, 4).toString(), "RIFF");
  assert.equal(wav.subarray(8, 12).toString(), "WAVE");
  assert.ok(wav.length > 100000);
});
