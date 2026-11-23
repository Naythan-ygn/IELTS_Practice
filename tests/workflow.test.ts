import test from "node:test";
import assert from "node:assert/strict";
import { activities } from "../lib/content.ts";
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import path from "node:path";
const base = process.env.TEST_BASE_URL || "http://127.0.0.1:3000";
test(
  "profile, diagnostic, resume, deterministic scoring, notebook, isolation, and deletion",
  { skip: !process.env.TEST_INTEGRATION },
  async () => {
    let cookie = "";
    async function api(path: string, body?: unknown, method?: string) {
      const r = await fetch(base + path, {
        method: method || (body ? "POST" : "GET"),
        headers: {
          "Content-Type": "application/json",
          ...(cookie ? { cookie } : {}),
          origin: base,
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      const c = r.headers.get("set-cookie");
      if (c) cookie = c.split(";")[0];
      return { status: r.status, body: await r.json() };
    }
    assert.equal(
      (await api("/api/auth/login", { username: "TTH", password: "9834" }))
        .status,
      200,
    );
    let s = await api("/api/state");
    const home = await fetch(base + "/");
    assert.equal(home.status, 200);
    assert.ok((await home.text()).includes("IELTS Sprint 30"));
    const audioAsset = await fetch(base + "/audio/workshop.wav");
    assert.equal(audioAsset.status, 200);
    assert.equal(
      Buffer.from(await audioAsset.arrayBuffer())
        .subarray(0, 4)
        .toString(),
      "RIFF",
    );
    assert.equal(s.status, 200);
    assert.equal(s.body.attempts.length, 0);
    assert.equal(s.body.aiEnabled, false);
    let p = await api("/api/action", {
      action: "profile",
      profile: { name: "Workflow test", target: 7, hours: 2 },
    });
    assert.equal(p.status, 200, JSON.stringify(p.body));
    assert.equal(p.body.target, 7);
    let a = await api("/api/action", {
      action: "start",
      activity: "grammar-diagnostic",
      day: 2,
    });
    assert.ok(a.body.id);
    assert.ok(!a.body.snapshot);
    const id = a.body.id;
    await api("/api/action", {
      action: "save",
      id,
      answers: { g0: "is", g1: "lives" },
      seconds: 1,
    });
    a = await api("/api/action", {
      action: "start",
      activity: "grammar-diagnostic",
      day: 2,
    });
    assert.equal(a.body.id, id);
    assert.equal(a.body.answers.g0, "is");
    a = await api("/api/action", { action: "submit", id });
    assert.equal(a.body.result.correct, 1);
    assert.equal(a.body.result.total, 20);
    assert.equal(a.body.result.band, null);
    await api("/api/action", { action: "submit", id });
    s = await api("/api/state");
    assert.equal(s.body.mistakes.length, 19);
    assert.equal(s.body.mistakes[0].repetitions, 1);
    assert.equal(s.body.profile.name, "Workflow test");
    p = await api("/api/action", {
      action: "completeDay",
      day: 3,
      reflection: "I learned to identify the main subject.",
    });
    assert.equal(p.status, 400);
    p = await api("/api/action", {
      action: "completeDay",
      day: 2,
      reflection: "I learned to identify the main subject.",
    });
    assert.equal(
      p.status,
      400,
      "Incomplete submissions must not complete lessons.",
    );
    a = await api("/api/action", {
      action: "start",
      activity: "grammar-diagnostic",
      day: 2,
    });
    const answers = Object.fromEntries(
      activities[0].questions.map((q) => [q.id, q.answer]),
    );
    await api("/api/action", {
      action: "save",
      id: a.body.id,
      answers,
      seconds: 1,
    });
    await api("/api/action", { action: "submit", id: a.body.id });
    p = await api("/api/action", {
      action: "completeDay",
      day: 2,
      reflection:
        "I learned to identify the head noun before choosing the verb.",
    });
    assert.equal(p.status, 200);
    s = await api("/api/state");
    assert.equal(s.body.days.length, 1);
    p = await api("/api/action", {
      action: "writing",
      prompt: "task1-cycling",
      body: "A short draft",
      submit: false,
    });
    assert.equal(p.status, 200);
    assert.equal(p.body.submitted_at, null);
    p = await api("/api/action", {
      action: "writing",
      prompt: "task1-cycling",
      body: "Too short",
      submit: true,
    });
    assert.equal(p.status, 400);
    const essay = Array.from({ length: 150 }, (_, i) =>
      i % 2 ? "comparison" : "overview",
    ).join(" ");
    p = await api("/api/action", {
      action: "writing",
      prompt: "task1-cycling",
      body: essay,
      submit: true,
      day: 5,
    });
    assert.ok(p.body.submitted_at);
    p = await api("/api/action", {
      action: "writing",
      prompt: "task1-cycling",
      body: essay,
      submit: false,
      day: 5,
    });
    assert.ok(
      p.body.submitted_at,
      "A late autosave must not clear submission.",
    );
    p = await api("/api/action", {
      action: "reviewWord",
      word: "word-0",
      rating: "good",
    });
    assert.equal(p.status, 200);
    s = await api("/api/state");
    assert.equal(s.body.reviews[0].interval_days, 2);
    a = await api("/api/action", {
      action: "start",
      activity: "reading-1",
      mode: "strict",
      day: 7,
    });
    assert.ok(a.body.deadline);
    assert.equal(
      Date.parse(a.body.deadline) - Date.parse(a.body.started_at),
      1200000,
    );
    assert.ok(!a.body.result);
    const strictId = a.body.id;
    const testDb = new DatabaseSync(
      path.join(
        process.env.DATA_DIR || path.join(process.cwd(), "data"),
        "sprint.sqlite",
      ),
    );
    testDb
      .prepare("UPDATE attempts SET deadline=? WHERE id=?")
      .run(new Date(Date.now() - 1000).toISOString(), strictId);
    testDb.close();
    a = await api("/api/action", {
      action: "save",
      id: strictId,
      answers: { r0: "False" },
      seconds: 30,
    });
    assert.ok(a.body.submitted_at);
    assert.equal(a.body.result.correct, 0, "Late answers must be rejected.");
    const wav = readFileSync(
      new URL("../public/audio/workshop.wav", import.meta.url),
    );
    const form = new FormData();
    form.set("audio", new Blob([wav], { type: "audio/wav" }), "test.wav");
    form.set("duration", "20");
    form.set("day", "6");
    form.set("prompt", "Synthetic audio upload for automated workflow test");
    const upload = await fetch(base + "/api/recordings", {
      method: "POST",
      headers: { cookie, origin: base },
      body: form,
    });
    const recording = await upload.json();
    assert.equal(upload.status, 200, JSON.stringify(recording));
    const play = await fetch(base + `/api/recordings?id=${recording.id}`, {
      headers: { cookie },
    });
    assert.equal(play.status, 200);
    assert.equal((await play.arrayBuffer()).byteLength, wav.length);
    const privatePlay = await fetch(
      base + `/api/recordings?id=${recording.id}`,
    );
    assert.equal(privatePlay.status, 401);
    assert.equal((await fetch(base + "/api/state")).status, 401);
    const forged = await fetch(base + "/api/action", {
      method: "POST",
      headers: {
        cookie,
        origin: "https://untrusted.example",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "profile",
        profile: { name: "Injected" },
      }),
    });
    assert.equal(forged.status, 400);
    p = await api("/api/state", undefined, "DELETE");
    assert.equal(p.status, 200);
    assert.equal((await api("/api/state")).status, 401);
    await api("/api/auth/login", { username: "TTH", password: "9834" });
    s = await api("/api/state");
    assert.equal(s.body.attempts.length, 0);
    assert.equal(s.body.writing.length, 0);
    assert.equal(s.body.reviews.length, 0);
    await api("/api/state", undefined, "DELETE");
  },
);
