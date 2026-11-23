import { cookies } from "next/headers";
import { checkOrigin } from "@/lib/auth";
import { createLogin, LOGIN_COOKIE, LOGIN_DAYS } from "@/lib/access";
export const runtime = "nodejs";
const failures = new Map<string, { count: number; until: number }>();
export async function POST(req: Request) {
  try {
    checkOrigin(req);
    if (Number(req.headers.get("content-length") || 0) > 4000)
      return Response.json(
        { error: "Login request is too large." },
        { status: 413 },
      );
    const address =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
    const limit = failures.get(address);
    if (limit && limit.until > Date.now() && limit.count >= 10)
      return Response.json(
        { error: "Too many attempts. Please try again in a few minutes." },
        { status: 429 },
      );
    const body = await req.json();
    if (typeof body.username !== "string" || typeof body.password !== "string")
      return Response.json(
        { error: "Enter your user name and password." },
        { status: 400 },
      );
    const jar = await cookies();
    const login = createLogin(
      body.username,
      body.password,
      jar.get("sprint_session")?.value,
    );
    if (!login) {
      failures.set(address, {
        count: limit && limit.until > Date.now() ? limit.count + 1 : 1,
        until:
          limit && limit.until > Date.now()
            ? limit.until
            : Date.now() + 15 * 60000,
      });
      return Response.json(
        { error: "The user name or password is incorrect." },
        { status: 401 },
      );
    }
    failures.delete(address);
    jar.set(LOGIN_COOKIE, login.token, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.SECURE_COOKIES === "true",
      path: "/",
      maxAge: LOGIN_DAYS * 86400,
    });
    return Response.json(
      { ok: true },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json(
      { error: "Unable to sign in. Please try again." },
      { status: 400 },
    );
  }
}
