import { currentUser, checkOrigin, AuthenticationError } from "@/lib/auth";
import {
  startAttempt,
  saveAnswers,
  submitAttempt,
  saveProfile,
  completeDay,
  saveWriting,
  reviewWord,
} from "@/lib/service";
import { run } from "@/lib/db";
export const runtime = "nodejs";
export async function POST(req: Request) {
  try {
    checkOrigin(req);
    if (Number(req.headers.get("content-length") || 0) > 100000)
      return Response.json({ error: "Request too large" }, { status: 413 });
    const user = await currentUser(),
      b = await req.json();
    let result: unknown;
    switch (b.action) {
      case "start":
        result = startAttempt(user, b.activity, b.mode || "practice", b.day);
        break;
      case "save":
        result = saveAnswers(user, b.id, b.answers || {}, b.seconds, b.timings);
        break;
      case "submit":
        result = submitAttempt(user, b.id);
        break;
      case "profile":
        result = saveProfile(user, b.profile);
        break;
      case "completeDay":
        completeDay(user, Number(b.day), String(b.reflection || ""));
        result = { ok: true };
        break;
      case "writing":
        result = saveWriting(
          user,
          b.prompt,
          String(b.body || ""),
          !!b.submit,
          b.day,
        );
        break;
      case "reviewWord":
        reviewWord(user, b.word, b.rating);
        result = { ok: true };
        break;
      case "mistake": {
        if (
          !["Not understood", "Learning", "Understood", "Mastered"].includes(
            b.status,
          )
        )
          throw Error("Invalid status");
        const interval =
          b.status === "Mastered" ? 14 : b.status === "Understood" ? 4 : 1;
        run(
          "UPDATE mistakes SET status=?,due=? WHERE id=? AND user_id=?",
          b.status,
          new Date(Date.now() + interval * 86400000).toISOString(),
          b.id,
          user,
        );
        result = { ok: true };
        break;
      }
      default:
        throw Error("Unknown action");
    }
    return Response.json(result);
  } catch (e) {
    return Response.json(
      { error: (e as Error).message },
      { status: e instanceof AuthenticationError ? 401 : 400 },
    );
  }
}
