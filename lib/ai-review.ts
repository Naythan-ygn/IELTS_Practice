import { row, run, rows } from "./db";
import { randomUUID } from "node:crypto";
export async function reviewSubject(
  user: string,
  kind: string,
  id: string,
  questionId = "",
) {
  if (!["legacy", "strategy", "recording"].includes(kind))
    throw Error("Invalid review source.");
  if (kind === "recording") {
    const recording = await row(
      "SELECT * FROM recordings WHERE id=? AND user_id=?",
      id,
      user,
    );
    if (!recording) throw Error("Recording not found.");
    if (recording.transcript.trim().length < 20)
      throw Error(
        "Add a typed transcript or self-review notes before requesting text feedback.",
      );
    return {
      title: "Speaking transcript / notes review",
      input: `Prompt: ${recording.prompt}\nUser-supplied transcript or notes (not a verified transcription): ${recording.transcript}\nReview relevant grammar, vocabulary and possible answer development. Give example revisions and a follow-up exercise. No audio has been sent or analysed. Do not score pronunciation, measured hesitation, fluency or an overall Speaking band.`,
    };
  }
  const a = await row(
    `SELECT * FROM ${kind === "legacy" ? "attempts" : "strategy_attempts"} WHERE id=? AND user_id=?`,
    id,
    user,
  );
  if (!a || !a.submitted_at)
    throw Error("Submit your own attempt before requesting AI analysis.");
  const result = JSON.parse(a.result),
    snapshot = JSON.parse(a.snapshot);
  const questions = questionId
    ? result.review.filter((q: any) => q.id === questionId)
    : result.review;
  if (!questions.length)
    throw Error("Question not found in your submitted attempt.");
  return {
    title: questionId ? "Answer analysis" : "Practice analysis",
    input: `Review the submitted ${kind} practice. Its deterministic answer key and score must remain unchanged. These are short practice items, not sufficient evidence for an IELTS band.\nSource passage: ${snapshot.passage || ""}\nListening transcript, if relevant: ${snapshot.transcript || ""}\nSubmitted questions and verified explanations: ${JSON.stringify(questions)}\nExplain why the learner's answers match or fail the source, identify possible traps without pretending to know their thoughts, show a reliable solving method, and give one related practice suggestion. If you suspect a key problem, flag it as a concern for review; do not replace the verified grade. For Writing/Speaking strategy-choice questions, analyse strategy knowledge only, not actual productive performance.`,
  };
}
export async function saveAIReview(
  user: string,
  kind: string,
  id: string,
  questionId: string,
  feedback: {
    answer: string;
    provider: string;
    model: string | null;
  },
) {
  await run(
    "INSERT INTO ai_reviews(id,user_id,source_kind,source_id,question_id,response,provider,model,created_at) VALUES (?,?,?,?,?,?,?,?,?) ON CONFLICT(user_id,source_kind,source_id,question_id) DO UPDATE SET response=excluded.response,provider=excluded.provider,model=excluded.model,created_at=excluded.created_at",
    randomUUID(),
    user,
    kind,
    id,
    questionId,
    feedback.answer,
    feedback.provider,
    feedback.model || "",
    new Date().toISOString(),
  );
}
export async function savedAIReviews(user: string) {
  return await rows(
    "SELECT id,source_kind,source_id,question_id,response,provider,model,created_at FROM ai_reviews WHERE user_id=? ORDER BY created_at DESC",
    user,
  );
}
