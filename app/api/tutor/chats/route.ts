import { currentUser, checkOrigin, AuthenticationError } from "@/lib/auth";
import { assertCoachingAllowed } from "@/lib/strategy-service";
import {
  listTutorChats,
  createTutorChat,
  readTutorChat,
  updateTutorChat,
  ChatError,
} from "@/lib/tutor-chats";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  try {
    const user = await currentUser();
    await assertCoachingAllowed(user);
    const id = new URL(req.url).searchParams.get("id");
    return Response.json(
      id
        ? await readTutorChat(user, id)
        : { chats: await listTutorChats(user) },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (e) {
    return Response.json(
      { error: (e as Error).message },
      {
        status:
          e instanceof AuthenticationError
            ? 401
            : e instanceof ChatError
              ? e.status
              : 400,
      },
    );
  }
}
export async function POST(req: Request) {
  try {
    checkOrigin(req);
    if (Number(req.headers.get("content-length") || 0) > 40000)
      throw new ChatError("Request too large.");
    const user = await currentUser();
    await assertCoachingAllowed(user);
    const body = await req.json();
    if (body.action === "create")
      return Response.json({ chat: await createTutorChat(user) });
    if (body.action === "update")
      return Response.json(
        await updateTutorChat(user, String(body.id || ""), body.changes || {}),
      );
    throw new ChatError("Unknown chat action.");
  } catch (e) {
    return Response.json(
      { error: (e as Error).message },
      {
        status:
          e instanceof AuthenticationError
            ? 401
            : e instanceof ChatError
              ? e.status
              : 400,
      },
    );
  }
}
