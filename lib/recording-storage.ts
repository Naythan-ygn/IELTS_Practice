import { mkdirSync, readFileSync, writeFileSync, unlinkSync } from "node:fs";
import path from "node:path";
import { cloudStorage, dataDir, batch, rows } from "./db";
export function maxRecordingBytes() {
  return cloudStorage() ? 4_000_000 : 20_000_000;
}
export async function saveRecordingAudio(
  id: string,
  file: string,
  audio: Buffer,
) {
  if (cloudStorage()) {
    const statements = [];
    for (let offset = 0; offset < audio.length; offset += 192_000)
      statements.push({
        sql: "INSERT INTO recording_chunks(recording_id,part,body) VALUES (?,?,?)",
        args: [
          id,
          offset / 192_000,
          audio.subarray(offset, offset + 192_000).toString("base64"),
        ],
      });
    await batch(statements);
  } else {
    mkdirSync(path.join(dataDir, "recordings"), { recursive: true });
    writeFileSync(path.join(dataDir, "recordings", file), audio);
  }
}
// The route checks the recording owner before reading its bytes.
export async function readRecordingAudio(id: string, file: string) {
  if (!cloudStorage())
    return readFileSync(path.join(dataDir, "recordings", file));
  const chunks = await rows(
    "SELECT body FROM recording_chunks WHERE recording_id=? ORDER BY part",
    id,
  );
  if (!chunks.length) throw Error("Recording file unavailable");
  return Buffer.concat(chunks.map((c) => Buffer.from(c.body, "base64")));
}
export function removeLocalRecording(file: string) {
  if (!cloudStorage())
    try {
      unlinkSync(path.join(dataDir, "recordings", file));
    } catch {}
}
