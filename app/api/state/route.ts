import { currentUser, checkOrigin, AuthenticationError } from "@/lib/auth";
import { state } from "@/lib/service";
import { rows, run, transaction } from "@/lib/db";
import { removeLocalRecording } from "@/lib/recording-storage";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    return Response.json(await state(await currentUser()), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    if (e instanceof AuthenticationError)
      return Response.json({ error: e.message }, { status: 401 });
    return Response.json(
      { error: "Your study data could not be loaded. Please try again." },
      { status: 500 },
    );
  }
}
export async function DELETE(req: Request) {
  try {
    checkOrigin(req);
    const user = await currentUser();
    const files = await rows(
      "SELECT file FROM recordings WHERE user_id=?",
      user,
    );
    await transaction(
      async () => await run("DELETE FROM users WHERE id=?", user),
    );
    for (const f of files) removeLocalRecording(f.file);
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json(
      { error: (e as Error).message },
      { status: e instanceof AuthenticationError ? 401 : 400 },
    );
  }
}
