import {
  createHash,
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { row, run, transaction, dataDir } from "./db";
import { ensureUser } from "./service";
export const LOGIN_COOKIE = "sprint_login";
export const LOGIN_DAYS = 7;
export class AuthenticationError extends Error {
  constructor() {
    super("Please sign in to continue.");
  }
}
const hash = (s: string) => createHash("sha256").update(s).digest("hex");
export function validCredentials(
  username: string,
  password: string,
  env: Record<string, string | undefined> = process.env,
) {
  if (username.length > 128 || password.length > 1024) return false;
  const expectedUser = env.LOGIN_USERNAME || "TTH",
    expectedPassword = env.LOGIN_PASSWORD || "9834";
  const userMatches = timingSafeEqual(
    Buffer.from(hash(username.trim())),
    Buffer.from(hash(expectedUser)),
  );
  const passwordMatches = timingSafeEqual(
    scryptSync(password, "ielts-sprint-login", 32),
    scryptSync(expectedPassword, "ielts-sprint-login", 32),
  );
  return userMatches && passwordMatches;
}
async function previousUser(token?: string) {
  if (!token) return null;
  const [id, signature] = token.split(".");
  if (
    !/^[a-f0-9]{48}$/.test(id || "") ||
    !/^[a-f0-9]{64}$/.test(signature || "")
  )
    return null;
  const keyFile = path.join(dataDir, "session.key");
  if (!existsSync(keyFile)) return null;
  const expected = createHmac("sha256", readFileSync(keyFile))
    .update(id)
    .digest("hex");
  return timingSafeEqual(Buffer.from(expected), Buffer.from(signature)) &&
    (await row("SELECT id FROM users WHERE id=?", id))
    ? id
    : null;
}
export async function createLogin(
  username: string,
  password: string,
  legacyCookie?: string,
  env: Record<string, string | undefined> = process.env,
) {
  if (!validCredentials(username, password, env)) return null;
  return await transaction(async () => {
    const name = env.LOGIN_USERNAME || "TTH";
    const account = await row(
      "SELECT * FROM login_accounts WHERE username=?",
      name,
    );
    const user =
      account?.user_id ||
      (await previousUser(legacyCookie)) ||
      randomBytes(24).toString("hex");
    await ensureUser(user);
    await run(
      "INSERT INTO login_accounts(username,user_id) VALUES (?,?) ON CONFLICT(username) DO UPDATE SET user_id=excluded.user_id",
      name,
      user,
    );
    const token = randomBytes(32).toString("hex"),
      expires = new Date(Date.now() + LOGIN_DAYS * 86400000).toISOString();
    await run(
      "DELETE FROM login_sessions WHERE expires_at<=?",
      new Date().toISOString(),
    );
    await run(
      "INSERT INTO login_sessions(token_hash,user_id,expires_at) VALUES (?,?,?)",
      hash(token),
      user,
      expires,
    );
    return { token, user, username: name, expires };
  });
}
export async function sessionUser(token?: string) {
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  return (
    ((
      await row(
        "SELECT user_id FROM login_sessions WHERE token_hash=? AND expires_at>?",
        hash(token),
        new Date().toISOString(),
      )
    )?.user_id as string | null) || null
  );
}
export async function revokeLogin(token?: string) {
  if (token)
    await run("DELETE FROM login_sessions WHERE token_hash=?", hash(token));
}
