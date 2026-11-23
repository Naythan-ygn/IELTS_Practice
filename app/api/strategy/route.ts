import { currentUser, checkOrigin, AuthenticationError } from "@/lib/auth";
import {
  catalog,
  strategyState,
  beginStrategy,
  saveStrategy,
  submitStrategy,
  explanation,
  generateMicro,
  getMicro,
  lessonStep,
  saveScenario,
  saveLegacyTiming,
  assertCoachingAllowed,
  strategyReport,
} from "@/lib/strategy-service";
import { run, row } from "@/lib/db";
import { strategies } from "@/lib/patterns";
import { randomUUID } from "node:crypto";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  try {
    const user = await currentUser(),
      params = new URL(req.url).searchParams;
    await assertCoachingAllowed(user);
    if (params.get("report"))
      return Response.json(
        await strategyReport(
          user,
          params.get("attempt") || "",
          params.get("legacy") === "1",
        ),
        { headers: { "Cache-Control": "private, no-store" } },
      );
    if (params.get("explain"))
      return Response.json(
        await explanation(
          user,
          params.get("attempt") || "",
          params.get("question") || "",
          params.get("legacy") === "1",
        ),
        { headers: { "Cache-Control": "private, no-store" } },
      );
    if (params.get("micro")) {
      await assertCoachingAllowed(user);
      return Response.json(await getMicro(user, params.get("micro")!));
    }
    await assertCoachingAllowed(user);
    return Response.json(
      { catalog: catalog(), state: await strategyState(user) },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (e) {
    return Response.json(
      { error: (e as Error).message },
      { status: e instanceof AuthenticationError ? 401 : 400 },
    );
  }
}
export async function POST(req: Request) {
  try {
    checkOrigin(req);
    if (Number(req.headers.get("content-length") || 0) > 150000)
      throw Error("Request too large.");
    const user = await currentUser(),
      b = await req.json();
    let result: unknown;
    switch (b.action) {
      case "begin":
        result = await beginStrategy(user, b);
        break;
      case "save":
        result = await saveStrategy(user, b.id, b.answers, b.timings);
        break;
      case "submit":
        result = await submitStrategy(user, b.id);
        break;
      case "understand":
        await assertCoachingAllowed(user);
        if (!strategies.some((s) => s.id === b.strategyId))
          throw Error("Strategy not found.");
        if (String(b.note || "").trim().length < 20)
          throw Error("Explain the strategy in at least 20 characters.");
        await run(
          "INSERT INTO strategy_progress(user_id,strategy_id,understood_at,note) VALUES (?,?,?,?) ON CONFLICT(user_id,strategy_id) DO UPDATE SET note=excluded.note",
          user,
          b.strategyId,
          new Date().toISOString(),
          String(b.note).slice(0, 5000),
        );
        result = { ok: true };
        break;
      case "lesson":
        result = await lessonStep(
          user,
          Number(b.day),
          b.stage,
          String(b.body || ""),
        );
        break;
      case "micro":
        result = await generateMicro(user, b.sourceAttempt);
        break;
      case "score":
        result = await saveScenario(user, b.scenario);
        break;
      case "timing":
        result = await saveLegacyTiming(user, b.id, b.timings);
        break;
      case "coach": {
        await assertCoachingAllowed(user);
        const modes = [
          "Essay Planning",
          "Introduction Builder",
          "Thesis Trainer",
          "Paragraph Development",
          "Grammar Correction",
          "Full Timed Essay",
          "Rewrite & Improve",
        ];
        if (!modes.includes(b.mode)) throw Error("Invalid coaching mode.");
        const original = String(b.original || "").slice(0, 20000),
          revision = String(b.revision || "").slice(0, 20000);
        if (original.trim().length < 20)
          throw Error("Add your own response before saving.");
        const feedback = {
          label:
            "Self-review prompts — not an AI assessment or a band estimate",
          criteria: [
            "Task coverage: check every instruction and each claim against the prompt.",
            "Coherence: identify the main idea of each paragraph and its supporting explanation.",
            "Lexical resource: check natural collocations and precise meanings.",
            "Grammar: check sentence boundaries, agreement and tense.",
          ],
          checks: {
            words: original.trim().split(/\s+/).length,
            paragraphs: original.trim().split(/\n\s*\n/).length,
          },
          suggestion:
            "Select one sentence to revise, explain the change, and compare the original with your revision. Request AI feedback for specific corrections if connected.",
        };
        await run(
          "INSERT INTO coaching_responses(id,user_id,mode,prompt,original,revision,feedback,updated_at,reason) VALUES (?,?,?,?,?,?,?,?,?) ON CONFLICT(user_id,mode) DO UPDATE SET prompt=excluded.prompt,original=excluded.original,revision=excluded.revision,feedback=excluded.feedback,updated_at=excluded.updated_at,reason=excluded.reason",
          randomUUID(),
          user,
          b.mode,
          String(b.prompt || "").slice(0, 3000),
          original,
          revision,
          JSON.stringify(feedback),
          new Date().toISOString(),
          String(b.reason || "").slice(0, 5000),
        );
        result = feedback;
        break;
      }
      default:
        throw Error("Unknown strategy action.");
    }
    return Response.json(result);
  } catch (e) {
    return Response.json(
      { error: (e as Error).message },
      { status: e instanceof AuthenticationError ? 401 : 400 },
    );
  }
}
