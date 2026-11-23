import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";
const folder = mkdtempSync(path.join(tmpdir(), "sprint-cloud-"));
// Exercise the libSQL adapter with a private file transport; no live credentials.
delete process.env.VERCEL;
process.env.TURSO_DATABASE_URL = pathToFileURL(
  path.join(folder, "shared.sqlite"),
).href;
process.env.DATA_DIR = path.join(folder, "must-not-be-created");
const { createLogin, sessionUser, revokeLogin } =
  await import("../lib/access.ts");
const {
  run,
  row,
  transaction,
  assertStorageConfiguration,
  StorageConfigurationError,
} = await import("../lib/db.ts");
const { saveProfile, state, startAttempt, saveAnswers, submitAttempt } =
  await import("../lib/service.ts");
const { createTutorChat, prepareTutorTurn, finishTutorTurn, readTutorChat } =
  await import("../lib/tutor-chats.ts");
const { saveRecordingAudio, readRecordingAudio } =
  await import("../lib/recording-storage.ts");
test("Vercel refuses ephemeral or missing storage configuration", () => {
  const url = process.env.TURSO_DATABASE_URL;
  process.env.VERCEL = "1";
  try {
    assert.throws(assertStorageConfiguration, StorageConfigurationError);
  } finally {
    delete process.env.VERCEL;
    process.env.TURSO_DATABASE_URL = url;
  }
});
test("cloud adapter keeps login, progress and chat history across cold processes without local data files", async () => {
  const login = (await createLogin("TTH", "9834", undefined, {}))!;
  assert.equal(await sessionUser(login.token), login.user);
  await saveProfile(login.user, { name: "Cloud learner", target: 7, hours: 2 });
  const a = await startAttempt(login.user, "grammar-diagnostic", "practice", 1);
  await saveAnswers(login.user, a.id, { g0: "is" }, 0);
  await submitAttempt(login.user, a.id);
  const chat = await createTutorChat(login.user);
  const turn = await prepareTutorTurn(login.user, chat.id, "Help with reading");
  await finishTutorTurn(
    login.user,
    turn,
    "## Read for evidence\n\n- Find the matching sentence.",
  );
  assert.equal((await readTutorChat(login.user, chat.id)).messages.length, 2);
  const snapshot = await state(login.user);
  assert.equal(snapshot.profile.name, "Cloud learner");
  assert.equal(snapshot.attempts.length, 1);
  assert.equal(snapshot.tutorChats.length, 1);
  const child = spawnSync(
    process.execPath,
    [
      "--import",
      "tsx",
      "--input-type=module",
      "-e",
      `const {sessionUser}=await import('./lib/access.ts');const {state}=await import('./lib/service.ts');const id=await sessionUser(process.env.TEST_LOGIN_TOKEN);const s=await state(id);console.log(JSON.stringify({id,name:s.profile.name,attempts:s.attempts.length,chats:s.tutorChats.length}));`,
    ],
    {
      cwd: process.cwd(),
      env: { ...process.env, TEST_LOGIN_TOKEN: login.token },
      encoding: "utf8",
      timeout: 30000,
    },
  );
  assert.equal(child.status, 0, child.stderr);
  assert.deepEqual(JSON.parse(child.stdout.trim()), {
    id: login.user,
    name: "Cloud learner",
    attempts: 1,
    chats: 1,
  });
  assert.ok(!existsSync(process.env.DATA_DIR!));
  await revokeLogin(login.token);
  assert.equal(await sessionUser(login.token), null);
});
test("cloud transactions roll back failures, isolate concurrent work, and cascade recording data", async () => {
  await assert.rejects(
    transaction(async () => {
      await run("INSERT INTO users(id) VALUES ('rolled-back')");
      await Promise.resolve();
      throw Error("rollback");
    }),
  );
  assert.equal(
    await row("SELECT id FROM users WHERE id='rolled-back'"),
    undefined,
  );
  await Promise.all([
    transaction(async () => {
      await run("INSERT INTO users(id) VALUES ('first-writer')");
      await new Promise((r) => setTimeout(r, 10));
    }),
    transaction(async () => {
      await run("INSERT INTO users(id) VALUES ('second-writer')");
    }),
  ]);
  assert.ok(await row("SELECT id FROM users WHERE id='second-writer'"));
  await run(
    "INSERT INTO recordings(id,user_id,prompt,mime,file,transcript,duration,created_at) VALUES ('audio','first-writer','Test','audio/wav','cloud.audio','',1,?)",
    new Date().toISOString(),
  );
  const audio = Buffer.alloc(400_000, 73);
  await saveRecordingAudio("audio", "cloud.audio", audio);
  assert.deepEqual(await readRecordingAudio("audio", "cloud.audio"), audio);
  await run("DELETE FROM users WHERE id='first-writer'");
  assert.equal(
    await row(
      "SELECT recording_id FROM recording_chunks WHERE recording_id='audio'",
    ),
    undefined,
  );
});
