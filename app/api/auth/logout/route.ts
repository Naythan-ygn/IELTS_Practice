import { cookies } from "next/headers";
import { checkOrigin } from "@/lib/auth";
import { LOGIN_COOKIE, revokeLogin } from "@/lib/access";
export const runtime = "nodejs";
export async function POST(req: Request) {
  try {
    checkOrigin(req);
    const jar = await cookies();
    revokeLogin(jar.get(LOGIN_COOKIE)?.value);
    jar.set(LOGIN_COOKIE, "", {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.SECURE_COOKIES === "true",
      path: "/",
      maxAge: 0,
    });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Unable to sign out." }, { status: 400 });
  }
}
