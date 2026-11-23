import test from "node:test";
import assert from "node:assert/strict";
const base = process.env.TEST_BASE_URL || "http://127.0.0.1:3000";
test(
  "chat HTTP workflow preserves separate history, context, drafts and ownership after reload",
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
    const list = await api("/api/tutor/chats");
    assert.equal(list.status, 200);
    assert.deepEqual(list.body.chats, []);
    const first = await api("/api/tutor/chats", { action: "create" });
    const second = await api("/api/tutor/chats", { action: "create" });
    assert.notEqual(first.body.chat.id, second.body.chat.id);
    const id = first.body.chat.id;
    const saved = await api("/api/tutor/chats", {
      action: "update",
      id,
      changes: {
        title: "Reading: evidence",
        contextNotes: "Use simple English and show the supporting sentence.",
        windowTokens: 2000,
        draft: "How can I distinguish False from Not Given?",
      },
    });
    assert.equal(saved.status, 200, JSON.stringify(saved.body));
    const restored = await api("/api/tutor/chats?id=" + id);
    assert.equal(restored.body.chat.title, "Reading: evidence");
    assert.equal(restored.body.chat.window_tokens, 2000);
    assert.equal(
      restored.body.chat.draft,
      "How can I distinguish False from Not Given?",
    );
    assert.ok(restored.body.chat.context_notes.includes("supporting sentence"));
    assert.equal(restored.body.memory.retainedMessages, 0);
    assert.ok(restored.body.memory.estimatedTokens > 0);
    const clean = await api("/api/tutor/chats?id=" + second.body.chat.id);
    assert.equal(clean.body.chat.context_notes, "");
    assert.equal(clean.body.chat.draft, "");
    assert.equal(clean.body.messages.length, 0);
    const invalid = await api("/api/tutor/chats", {
      action: "update",
      id,
      changes: { windowTokens: 1 },
    });
    assert.equal(invalid.status, 400);
    const other = await fetch(base + "/api/tutor/chats?id=" + id);
    assert.equal(other.status, 401);
    const after = await api("/api/state");
    assert.equal(after.body.tutorChats.length, 2);
    assert.ok(!JSON.stringify(after.body.tutorChats).includes("request_token"));
    await api("/api/state", undefined, "DELETE");
    const gone = await api("/api/tutor/chats?id=" + id);
    assert.equal(gone.status, 401);
  },
);
