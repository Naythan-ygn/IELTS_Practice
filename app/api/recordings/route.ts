import { currentUser, checkOrigin, AuthenticationError } from "@/lib/auth";
import { row, run, dataDir } from "@/lib/db";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
export const runtime = "nodejs";
export async function POST(req: Request) {
  try {
    checkOrigin(req);
    const user = await currentUser();
    if (Number(req.headers.get("content-length") || 0) > 20_000_000)
      throw Error("Maximum recording size is 20 MB.");
    const form = await req.formData();
    const audio = form.get("audio");
    if (!(audio instanceof File) || audio.size < 100 || audio.size > 20_000_000)
      throw Error("Please provide a valid recording under 20 MB.");
    if (!/^(audio\/(webm|ogg|mp4|wav)|video\/webm)/.test(audio.type))
      throw Error("Unsupported audio format");
    const duration = Number(form.get("duration"));
    if (!Number.isFinite(duration) || duration < 1 || duration > 900)
      throw Error("Invalid recording duration.");
    const day = Number(form.get("day")) || null;
    if (day !== null && (!Number.isInteger(day) || day < 1 || day > 30))
      throw Error("Invalid course day.");
    const id = randomUUID(),
      file = `${id}.audio`;
    mkdirSync(path.join(dataDir, "recordings"), { recursive: true });
    writeFileSync(
      path.join(dataDir, "recordings", file),
      Buffer.from(await audio.arrayBuffer()),
    );
    run(
      "INSERT INTO recordings(id,user_id,prompt,mime,file,transcript,duration,created_at,day) VALUES (?,?,?,?,?,?,?,?,?)",
      id,
      user,
      String(form.get("prompt") || "Speaking practice").slice(0, 1000),
      audio.type,
      file,
      String(form.get("transcript") || "").slice(0, 15000),
      Math.round(duration),
      new Date().toISOString(),
      day,
    );
    return Response.json({ id });
  } catch (e) {
    return Response.json(
      { error: (e as Error).message },
      { status: e instanceof AuthenticationError ? 401 : 400 },
    );
  }
}
export async function GET(req: Request) {
  try {
    const user = await currentUser();
    const a = row(
      "SELECT * FROM recordings WHERE id=? AND user_id=?",
      new URL(req.url).searchParams.get("id") || "",
      user,
    );
    if (!a) return new Response("Recording not found", { status: 404 });
    try {
      return new Response(
        readFileSync(path.join(dataDir, "recordings", a.file)),
        {
          headers: {
            "Content-Type": a.mime,
            "Cache-Control": "private, no-store",
            "X-Content-Type-Options": "nosniff",
          },
        },
      );
    } catch {
      return new Response("Recording file unavailable", { status: 404 });
    }
  } catch (e) {
    return Response.json(
      { error: (e as Error).message },
      { status: e instanceof AuthenticationError ? 401 : 500 },
    );
  }
}
