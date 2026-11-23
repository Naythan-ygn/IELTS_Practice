import test from "node:test";
import assert from "node:assert/strict";
const base = process.env.TEST_BASE_URL || "http://127.0.0.1:3000";
test(
  "HTTP review access and offline AI fallback preserve owned grades without provider calls",
  { skip: !process.env.TEST_INTEGRATION },
  async () => {
    let cookie = "";
    async function api(path: string, body?: unknown, method?: string) {
      const r = await fetch(base + path, {
        method: method || (body ? "POST" : "GET"),
        headers: {
          "Content-Type": "application/json",
          origin: base,
          ...(cookie ? { cookie } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      if (r.headers.get("set-cookie"))
        cookie = r.headers.get("set-cookie")!.split(";")[0];
      return { status: r.status, body: await r.json() };
    }
    assert.equal(
      (await api("/api/auth/login", { username: "TTH", password: "9834" }))
        .status,
      200,
    );
    const s = await api("/api/state");
    assert.equal(
      s.body.aiEnabled,
      false,
      "Integration checks require an offline, isolated server; never issue a paid provider call.",
    );
    assert.ok(!JSON.stringify(s.body.ai).includes("API_KEY"));
    let a = await api("/api/action", {
      action: "start",
      activity: "reading-1",
      day: 3,
    });
    const id = a.body.id;
    let review = await api(
      `/api/ai-review?kind=legacy&sourceId=${id}&questionId=r0`,
    );
    assert.equal(review.status, 400);
    await api("/api/action", {
      action: "save",
      id,
      answers: { r0: "True" },
      seconds: 0,
    });
    a = await api("/api/action", { action: "submit", id });
    const grade = JSON.stringify(a.body.result);
    review = await api(
      `/api/ai-review?kind=legacy&sourceId=${id}&questionId=r0`,
    );
    assert.equal(review.status, 200);
    assert.equal(review.body.review, null);
    assert.equal(review.body.ai.enabled, false);
    const analysis = await api("/api/tutor", {
      attemptId: id,
      attemptSource: "legacy",
      questionId: "r0",
    });
    assert.equal(analysis.status, 503);
    assert.ok(analysis.body.error.includes("OPENROUTER_API_KEY"));
    const after = await api("/api/state");
    assert.equal(
      JSON.stringify(after.body.attempts.find((a: any) => a.id === id).result),
      grade,
    );
    assert.equal(after.body.aiReviews.length, 0);
    const other = await fetch(
      base + `/api/ai-review?kind=legacy&sourceId=${id}&questionId=r0`,
    );
    assert.equal(other.status, 401);
    await api("/api/state", undefined, "DELETE");
  },
);
