import { maxRecordingBytes } from "./recording-storage";
import { randomUUID } from "node:crypto";
import { activities, course, words, writingPrompts } from "./content";
import { row, rows, run, transaction } from "./db";
import { isCorrect, reviewSchedule, wordCount } from "./scoring";
import { strategyState, saveLegacyTiming } from "./strategy-service";
import { aiStatus } from "./ai";
import { savedAIReviews } from "./ai-review";
import { listTutorChats } from "./tutor-chats";
export function today() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Rangoon",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
export async function ensureUser(id: string) {
  await run("INSERT OR IGNORE INTO users(id) VALUES (?)", id);
  if (!(await row("SELECT user_id FROM profiles WHERE user_id=?", id))) {
    const start = today();
    const exam = new Date(`${start}T12:00:00Z`);
    exam.setUTCDate(exam.getUTCDate() + 30);
    await run(
      "INSERT INTO profiles(user_id,data) VALUES (?,?)",
      id,
      JSON.stringify({
        name: "Learner",
        target: 6.5,
        startDate: start,
        examDate: exam.toISOString().slice(0, 10),
        hours: 3,
        difficulty: "Intermediate",
        language: "English",
        theme: "light",
        notifications: true,
        audio: true,
        onboarded: false,
      }),
    );
  }
}
export async function profile(id: string) {
  return JSON.parse(
    (await row("SELECT data FROM profiles WHERE user_id=?", id))!.data,
  );
}
async function publicAttempt(
  a: Record<string, any>,
): Promise<Record<string, any>> {
  const { snapshot, ...rest } = a;
  return {
    ...rest,
    timings: JSON.parse(
      (
        await row(
          "SELECT data FROM question_timings WHERE user_id=? AND attempt_id=?",
          a.user_id,
          a.id,
        )
      )?.data || "{}",
    ),
    answers: JSON.parse(a.answers),
    result: a.result ? JSON.parse(a.result) : null,
  };
}
export async function state(id: string) {
  for (const expired of await rows(
    "SELECT id FROM attempts WHERE user_id=? AND submitted_at IS NULL AND deadline IS NOT NULL AND deadline<=?",
    id,
    new Date().toISOString(),
  ))
    await submitAttempt(id, expired.id);
  const attempts = await rows(
    "SELECT * FROM attempts WHERE user_id=? ORDER BY started_at DESC",
    id,
  );
  const writing = (await rows("SELECT * FROM writing WHERE user_id=?", id)).map(
    (w) => ({ ...w, feedback: w.feedback ? JSON.parse(w.feedback) : null }),
  );
  const tutorChats = await listTutorChats(id);
  return {
    profile: await profile(id),
    account:
      (await row("SELECT username FROM login_accounts WHERE user_id=?", id)) ||
      null,
    strategy: await strategyState(id),
    attempts: await Promise.all(attempts.map(publicAttempt)),
    mistakes: await rows(
      "SELECT * FROM mistakes WHERE user_id=? ORDER BY repetitions DESC,created_at DESC",
      id,
    ),
    reviews: await rows("SELECT * FROM vocabulary_reviews WHERE user_id=?", id),
    days: await rows("SELECT * FROM study_days WHERE user_id=?", id),
    writing,
    recordings: await rows(
      "SELECT id,prompt,mime,transcript,duration,created_at,day FROM recordings WHERE user_id=? ORDER BY created_at DESC",
      id,
    ),
    messages: await rows(
      "SELECT * FROM tutor_messages WHERE user_id=? ORDER BY created_at",
      id,
    ),
    aiEnabled: aiStatus().enabled,
    tutorChats,
    ai: aiStatus(),
    aiReviews: await savedAIReviews(id),
    serverDate: today(),
    maxRecordingBytes: maxRecordingBytes(),
  };
}
export async function startAttempt(
  user: string,
  activityId: string,
  mode: string,
  day?: number,
) {
  const a = activities.find((a) => a.id === activityId);
  if (!a) throw Error("Activity not found");
  if (!["practice", "strict"].includes(mode)) throw Error("Invalid mode");
  if (mode === "strict" && a.skill !== "Reading")
    throw Error(
      "Only the reading checkpoint supports strict mode in this release.",
    );
  const existing = await row(
    "SELECT * FROM attempts WHERE user_id=? AND activity_id=? AND mode=? AND submitted_at IS NULL",
    user,
    a.id,
    mode,
  );
  if (existing) {
    if (existing.deadline && Date.parse(existing.deadline) <= Date.now())
      return await submitAttempt(user, existing.id);
    return await publicAttempt(existing);
  }
  const id = randomUUID(),
    now = new Date();
  await run(
    "INSERT INTO attempts(id,user_id,activity_id,skill,mode,day,started_at,deadline,snapshot) VALUES (?,?,?,?,?,?,?,?,?)",
    id,
    user,
    a.id,
    a.skill,
    mode,
    day || null,
    now.toISOString(),
    mode === "strict"
      ? new Date(now.getTime() + a.minutes * 60000).toISOString()
      : null,
    JSON.stringify(a),
  );
  return await publicAttempt(
    (await row("SELECT * FROM attempts WHERE id=?", id))!,
  );
}
export async function saveAnswers(
  user: string,
  id: string,
  answers: Record<string, string>,
  seconds: number,
  timings?: Record<string, number>,
) {
  const a = await row(
    "SELECT * FROM attempts WHERE id=? AND user_id=?",
    id,
    user,
  );
  if (!a) throw Error("Attempt not found");
  if (a.submitted_at) return await publicAttempt(a);
  if (a.deadline && Date.parse(a.deadline) <= Date.now())
    return await submitAttempt(user, id);
  if (timings) await saveLegacyTiming(user, id, timings);
  const snap = JSON.parse(a.snapshot);
  const valid: Record<string, string> = {};
  for (const q of snap.questions) {
    if (typeof answers[q.id] === "string")
      valid[q.id] = answers[q.id].slice(0, 500);
  }
  const elapsed = Math.floor((Date.now() - Date.parse(a.started_at)) / 1000);
  await run(
    "UPDATE attempts SET answers=?,active_seconds=? WHERE id=?",
    JSON.stringify(valid),
    Math.max(a.active_seconds, Math.min(Math.max(0, seconds || 0), elapsed)),
    id,
  );
  return await publicAttempt(
    (await row("SELECT * FROM attempts WHERE id=?", id))!,
  );
}
export async function submitAttempt(user: string, id: string) {
  return await transaction(async () => {
    const a = await row(
      "SELECT * FROM attempts WHERE id=? AND user_id=?",
      id,
      user,
    );
    if (!a) throw Error("Attempt not found");
    if (a.submitted_at) return await publicAttempt(a);
    const content = JSON.parse(a.snapshot),
      answers = JSON.parse(a.answers),
      now = new Date().toISOString();
    const review = content.questions.map((q: any) => ({
      ...q,
      student: answers[q.id] || "",
      correct: isCorrect(answers[q.id] || "", q.answer),
    }));
    const correct = review.filter((q: any) => q.correct).length;
    const result = {
      correct,
      answered: review.filter((q: any) => q.student.trim()).length,
      total: review.length,
      accuracy: Math.round((correct / review.length) * 100),
      review,
      band: null,
      label: "Practice accuracy — not an IELTS band",
      transcript: content.transcript || null,
    };
    await run(
      "UPDATE attempts SET submitted_at=?,result=? WHERE id=?",
      now,
      JSON.stringify(result),
      id,
    );
    for (const q of review.filter((q: any) => !q.correct)) {
      await run(
        `INSERT INTO mistakes(id,user_id,question_id,activity_id,question,answer,correction,explanation,category,due,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(user_id,activity_id,question_id) DO UPDATE SET answer=excluded.answer,repetitions=repetitions+1,status='Learning',due=excluded.due`,
        randomUUID(),
        user,
        q.id,
        a.activity_id,
        q.text,
        q.student,
        q.answer,
        q.explanation,
        q.type,
        now,
        now,
      );
    }
    return await publicAttempt(
      (await row("SELECT * FROM attempts WHERE id=?", id))!,
    );
  });
}
export async function saveProfile(user: string, input: any) {
  const old = await profile(user);
  const p = { ...old };
  if (typeof input.name === "string")
    p.name = input.name.trim().slice(0, 60) || "Learner";
  for (const key of ["startDate", "examDate"])
    if (input[key] !== undefined) {
      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(input[key]) ||
        !Number.isFinite(Date.parse(input[key]))
      )
        throw Error("Use a valid date.");
      p[key] = input[key];
    }
  if (input.target !== undefined) {
    if (
      ![4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9].includes(
        Number(input.target),
      )
    )
      throw Error("Choose a valid target band.");
    p.target = Number(input.target);
  }
  if (input.hours !== undefined) {
    p.hours = Number(input.hours);
    if (!Number.isFinite(p.hours) || p.hours < 0.5 || p.hours > 8)
      throw Error("Daily study time must be between 0.5 and 8 hours.");
  }
  if (p.examDate < p.startDate)
    throw Error(
      "Examination date must be on or after your preparation start date.",
    );
  for (const [key, values] of Object.entries({
    theme: ["light", "dark"],
    language: ["English", "Burmese"],
    difficulty: ["Foundation", "Intermediate", "Advanced"],
  })) {
    if (input[key] !== undefined) {
      if (!values.includes(input[key])) throw Error("Invalid preference");
      p[key] = input[key];
    }
  }
  for (const key of ["notifications", "audio", "onboarded"])
    if (typeof input[key] === "boolean") p[key] = input[key];
  await run(
    "UPDATE profiles SET data=?,updated_at=? WHERE user_id=?",
    JSON.stringify(p),
    new Date().toISOString(),
    user,
  );
  return p;
}
export async function completeDay(
  user: string,
  day: number,
  reflection: string,
) {
  const lesson = course[day - 1];
  if (!lesson || reflection.trim().length < 20)
    throw Error("Add a reflection of at least 20 characters.");
  let complete = false;
  if (lesson.activity === "writing")
    complete = !!(await row(
      "SELECT id FROM writing WHERE user_id=? AND day=? AND submitted_at IS NOT NULL",
      user,
      day,
    ));
  else if (lesson.activity === "speaking")
    complete = !!(await row(
      "SELECT id FROM recordings WHERE user_id=? AND day=? AND duration>=20",
      user,
      day,
    ));
  else
    complete = !!(await row(
      "SELECT id FROM attempts WHERE user_id=? AND day=? AND activity_id=? AND submitted_at IS NOT NULL AND json_extract(result,'$.answered')=json_extract(result,'$.total')",
      user,
      day,
      lesson.activity,
    ));
  if (!complete)
    throw Error("Complete the assigned practice before finishing this day.");
  if ([21, 27, 29].includes(day))
    throw Error(
      "Full mock content is pending. This day cannot be marked complete yet.",
    );
  if (
    day === 1 &&
    (!(await row(
      "SELECT id FROM attempts WHERE user_id=? AND activity_id=? AND submitted_at IS NOT NULL AND json_extract(result,'$.answered')=json_extract(result,'$.total')",
      user,
      "vocabulary-diagnostic",
    )) ||
      !(await row(
        "SELECT id FROM attempts WHERE user_id=? AND activity_id=? AND submitted_at IS NOT NULL AND json_extract(result,'$.answered')=json_extract(result,'$.total')",
        user,
        "reading-1",
      )) ||
      !(await row(
        "SELECT id FROM attempts WHERE user_id=? AND activity_id=? AND submitted_at IS NOT NULL AND json_extract(result,'$.answered')=json_extract(result,'$.total')",
        user,
        "listening-1",
      )) ||
      !(await row(
        "SELECT id FROM writing WHERE user_id=? AND submitted_at IS NOT NULL",
        user,
      )) ||
      !(await row(
        "SELECT id FROM recordings WHERE user_id=? AND duration>=20",
        user,
      )))
  )
    throw Error("Complete all six diagnostic components first.");
  await run(
    "INSERT INTO study_days(user_id,day,reflection,completed_at) VALUES (?,?,?,?) ON CONFLICT(user_id,day) DO UPDATE SET reflection=excluded.reflection",
    user,
    day,
    reflection.trim().slice(0, 3000),
    new Date().toISOString(),
  );
}
export async function saveWriting(
  user: string,
  promptId: string,
  body: string,
  submit: boolean,
  day?: number,
) {
  const p = writingPrompts.find((p) => p.id === promptId);
  if (!p) throw Error("Unknown prompt");
  if (body.length > 30000) throw Error("Response is too long.");
  if (submit && wordCount(body) < (p.task === 1 ? 150 : 250))
    throw Error(
      `Write at least ${p.task === 1 ? 150 : 250} words before submitting.`,
    );
  const old = await row(
    "SELECT * FROM writing WHERE user_id=? AND prompt_id=?",
    user,
    promptId,
  );
  const now = new Date().toISOString();
  await run(
    "INSERT INTO writing(id,user_id,prompt_id,day,body,submitted_at,updated_at) VALUES (?,?,?,?,?,?,?) ON CONFLICT(user_id,prompt_id) DO UPDATE SET body=excluded.body,day=excluded.day,submitted_at=CASE WHEN writing.body=excluded.body AND excluded.submitted_at IS NULL THEN writing.submitted_at ELSE excluded.submitted_at END,feedback=CASE WHEN writing.body=excluded.body THEN writing.feedback ELSE NULL END,updated_at=excluded.updated_at",
    old?.id || randomUUID(),
    user,
    promptId,
    day || null,
    body,
    submit ? now : null,
    now,
  );
  return await row(
    "SELECT * FROM writing WHERE user_id=? AND prompt_id=?",
    user,
    promptId,
  );
}
export async function reviewWord(
  user: string,
  wordId: string,
  rating: "again" | "good" | "easy",
) {
  if (
    !words.some((w) => w.id === wordId) ||
    !["again", "good", "easy"].includes(rating)
  )
    throw Error("Invalid review");
  const old = await row(
    "SELECT * FROM vocabulary_reviews WHERE user_id=? AND word_id=?",
    user,
    wordId,
  );
  const s = reviewSchedule(rating, old?.interval_days || 0);
  await run(
    "INSERT INTO vocabulary_reviews(user_id,word_id,interval_days,due,reviews) VALUES (?,?,?,?,1) ON CONFLICT(user_id,word_id) DO UPDATE SET interval_days=excluded.interval_days,due=excluded.due,reviews=reviews+1",
    user,
    wordId,
    s.interval,
    s.due,
  );
}
