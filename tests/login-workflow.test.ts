import test from "node:test";
import assert from "node:assert/strict";
const base = process.env.TEST_BASE_URL || "http://127.0.0.1:3000";
test(
  "login protects pages and every private API, shows the dedication, and revokes logout sessions",
  { skip: !process.env.TEST_INTEGRATION },
  async () => {
    const home = await fetch(base + "/", { redirect: "manual" });
    assert.equal(home.status, 307);
    assert.equal(home.headers.get("location"), "/login");
    const page = await (await fetch(base + "/login")).text();
    assert.ok(page.includes("A Present for My Lovely Soulmate"));
    assert.ok(page.includes("made with Love ❤️ built by H.P.T"));
    assert.ok(!page.includes("9834"));
    for (const [url, method] of [
      ["/api/state", "GET"],
      ["/api/state", "DELETE"],
      ["/api/action", "POST"],
      ["/api/strategy", "GET"],
      ["/api/strategy", "POST"],
      ["/api/tutor", "POST"],
      ["/api/tutor/chats", "GET"],
      ["/api/tutor/chats", "POST"],
      ["/api/ai-review", "GET"],
      ["/api/recordings", "GET"],
      ["/api/recordings", "POST"],
    ]) {
      const res = await fetch(base + url, {
        method,
        headers: { origin: base, "Content-Type": "application/json" },
        ...(method === "POST" ? { body: "{}" } : {}),
      });
      assert.equal(res.status, 401, url + " " + method);
    }
    const login = (password: string, origin = base) =>
      fetch(base + "/api/auth/login", {
        method: "POST",
        headers: { origin, "Content-Type": "application/json" },
        body: JSON.stringify({ username: "TTH", password }),
      });
    assert.equal((await login("wrong")).status, 401);
    assert.equal(
      (await login("9834", "https://untrusted.example")).status,
      400,
    );
    const signed = await login("9834");
    assert.equal(signed.status, 200);
    assert.deepEqual(await signed.json(), { ok: true });
    const setCookie = signed.headers.get("set-cookie")!;
    assert.match(setCookie, /HttpOnly/i);
    assert.match(setCookie, /SameSite=strict/i);
    const cookie = setCookie.split(";")[0];
    assert.equal(
      (
        await fetch(base + "/login", {
          headers: { cookie },
          redirect: "manual",
        })
      ).headers.get("location"),
      "/",
    );
    assert.equal(
      (await fetch(base + "/", { headers: { cookie } })).status,
      200,
    );
    const state = await fetch(base + "/api/state", { headers: { cookie } });
    assert.equal(state.status, 200);
    assert.equal((await state.json()).account.username, "TTH");
    const logout = await fetch(base + "/api/auth/logout", {
      method: "POST",
      headers: { cookie, origin: base },
    });
    assert.equal(logout.status, 200);
    assert.match(logout.headers.get("set-cookie")!, /Max-Age=0/i);
    assert.equal(
      (await fetch(base + "/api/state", { headers: { cookie } })).status,
      401,
    );
    const again = await login("9834");
    const nextCookie = again.headers.get("set-cookie")!.split(";")[0];
    await fetch(base + "/api/state", {
      method: "DELETE",
      headers: { cookie: nextCookie, origin: base },
    });
  },
);
