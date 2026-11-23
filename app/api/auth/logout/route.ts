import { cookies } from "next/headers";
import { checkOrigin, secureCookies } from "@/lib/auth";
import { LOGIN_COOKIE, revokeLogin } from "@/lib/access";
export const runtime = "nodejs";
export async function POST(req: Request) {
  try {
    checkOrigin(req);
    const jar = await cookies();
    await revokeLogin(jar.get(LOGIN_COOKIE)?.value);
    jar.set(LOGIN_COOKIE, "", {
      httpOnly: true,
      sameSite: "strict",
      secure: secureCookies(),
      path: "/",
      maxAge: 0,
    });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Unable to sign out." }, { status: 400 });
  }
}
