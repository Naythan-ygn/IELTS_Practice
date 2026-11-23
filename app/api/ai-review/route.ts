import { currentUser, AuthenticationError } from "@/lib/auth";
import { assertCoachingAllowed } from "@/lib/strategy-service";
import { reviewSubject } from "@/lib/ai-review";
import { aiStatus } from "@/lib/ai";
import { row } from "@/lib/db";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  try {
    const user = await currentUser();
    await assertCoachingAllowed(user);
    const params = new URL(req.url).searchParams,
      kind = params.get("kind") || "",
      id = params.get("sourceId") || "",
      questionId = params.get("questionId") || "";
    await reviewSubject(user, kind, id, questionId);
    return Response.json(
      {
        ai: aiStatus(),
        review:
          (await row(
            "SELECT response,provider,model,created_at FROM ai_reviews WHERE user_id=? AND source_kind=? AND source_id=? AND question_id=?",
            user,
            kind,
            id,
            questionId,
          )) || null,
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (e) {
    if (e instanceof AuthenticationError)
      return Response.json({ error: e.message }, { status: 401 });
    return Response.json(
      {
        error:
          "Submitted review unavailable. Finish your assessment and use your own saved attempt.",
      },
      { status: 400 },
    );
  }
}
