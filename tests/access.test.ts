import test from "node:test";
import assert from "node:assert/strict";
import { createHmac, randomUUID } from "node:crypto";
import { writeFileSync } from "node:fs";
import path from "node:path";
process.env.DATA_DIR = path.resolve(".test-data", "login-" + randomUUID());
const { validCredentials, createLogin, sessionUser, revokeLogin } =
  await import("../lib/access.ts");
const { ensureUser } = await import("../lib/service.ts");
const { row, run, dataDir } = await import("../lib/db.ts");
test("default credentials and server overrides require an exact password", () => {
  assert.ok(validCredentials("TTH", "9834", {}));
  assert.ok(!validCredentials("TTH", "9834 ", {}));
  assert.ok(!validCredentials("tth", "9834", {}));
  assert.ok(!validCredentials("TTH", "wrong", {}));
  assert.ok(!validCredentials("TTH", "9834", { LOGIN_PASSWORD: "changed" }));
  assert.ok(
    validCredentials("Private", "changed", {
      LOGIN_USERNAME: "Private",
      LOGIN_PASSWORD: "changed",
    }),
  );
});
test("login adopts verified existing progress, shares the account, and revokes sessions", async () => {
  const id = "a".repeat(48);
  await ensureUser(id);
  await run(
    "UPDATE profiles SET data=? WHERE user_id=?",
    JSON.stringify({ name: "Existing learner" }),
    id,
  );
  const key = Buffer.from("fixture-secret");
  writeFileSync(path.join(dataDir, "session.key"), key);
  const legacy = id + "." + createHmac("sha256", key).update(id).digest("hex");
  assert.equal(await createLogin("TTH", "wrong", legacy, {}), null);
  const login = (await createLogin("TTH", "9834", legacy, {}))!;
  assert.equal(login.user, id);
  assert.equal(await sessionUser(login.token), id);
  assert.equal(
    JSON.parse(
      (await row("SELECT data FROM profiles WHERE user_id=?", id))!.data,
    ).name,
    "Existing learner",
  );
  assert.notEqual(
    (await row("SELECT token_hash FROM login_sessions WHERE user_id=?", id))!
      .token_hash,
    login.token,
  );
  const second = (await createLogin("TTH", "9834", undefined, {}))!;
  assert.equal(second.user, id);
  await revokeLogin(login.token);
  assert.equal(await sessionUser(login.token), null);
  assert.equal(await sessionUser(second.token), id);
  await run(
    "UPDATE login_sessions SET expires_at=?",
    "2000-01-01T00:00:00.000Z",
  );
  assert.equal(await sessionUser(second.token), null);
  await run("DELETE FROM users WHERE id=?", id);
  assert.equal(
    (await row("SELECT user_id FROM login_accounts WHERE username=?", "TTH"))!
      .user_id,
    null,
  );
  const fresh = (await createLogin("TTH", "9834", legacy, {}))!;
  assert.notEqual(fresh.user, id);
  assert.equal(await sessionUser("forged"), null);
});
