import { currentUser, checkOrigin, AuthenticationError } from "@/lib/auth";
import { row, run, transaction } from "@/lib/db";
import {
  saveRecordingAudio,
  readRecordingAudio,
  maxRecordingBytes,
} from "@/lib/recording-storage";
import { randomUUID } from "node:crypto";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(req: Request) {
  try {
    checkOrigin(req);
    const user = await currentUser();
    const maxBytes = maxRecordingBytes();
    if (Number(req.headers.get("content-length") || 0) > maxBytes + 100_000)
      throw Error(`Maximum recording size is ${maxBytes / 1_000_000} MB.`);
    const form = await req.formData();
    const audio = form.get("audio");
    if (!(audio instanceof File) || audio.size < 100 || audio.size > maxBytes)
      throw Error(
        `Please provide a valid recording under ${maxBytes / 1_000_000} MB.`,
      );
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
    const bytes = Buffer.from(await audio.arrayBuffer());
    await transaction(async () => {
      await run(
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
      await saveRecordingAudio(id, file, bytes);
    });
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
    const a = await row(
      "SELECT * FROM recordings WHERE id=? AND user_id=?",
      new URL(req.url).searchParams.get("id") || "",
      user,
    );
    if (!a) return new Response("Recording not found", { status: 404 });
    try {
      return new Response(await readRecordingAudio(a.id, a.file), {
        headers: {
          "Content-Type": a.mime,
          "Cache-Control": "private, no-store",
          "X-Content-Type-Options": "nosniff",
        },
      });
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
