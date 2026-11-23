"use client";
import {
  CheckCircle2,
  Clock,
  Flag,
  Headphones,
  Pause,
  PenLine,
  ShieldCheck,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Data } from "./ui";
import { clock, request, Tag } from "./ui";
import { EvidencePanel } from "./strategy-workspace";
import { StrategyReport } from "./strategy-report";
export function PracticePlayer({
  activity: a,
  initial,
  act,
  onClose,
  onError,
  onStrategy,
  refresh,
}: Data) {
  const [answers, setAnswers] = useState<Record<string, string>>(
      initial.answers,
    ),
    [attempt, setAttempt] = useState(initial),
    [seconds, setSeconds] = useState(initial.active_seconds),
    [remaining, setRemaining] = useState(
      initial.deadline
        ? Math.max(
            0,
            Math.ceil((Date.parse(initial.deadline) - Date.now()) / 1000),
          )
        : 0,
    ),
    [saving, setSaving] = useState("All changes saved"),
    [busy, setBusy] = useState(false),
    [font, setFont] = useState(17),
    [highlight, setHighlight] = useState(false),
    [flags, setFlags] = useState<string[]>([]),
    [audioError, setAudioError] = useState(false);
  const latest = useRef({ answers, seconds }),
    timings = useRef<Record<string, number>>(initial.timings || {}),
    focusedQuestion = useRef(a.questions[0]?.id),
    chain = useRef<Promise<any>>(Promise.resolve()),
    submitted = useRef(!!initial.submitted_at),
    autoSubmit = useRef(false);
  latest.current = { answers, seconds };
  const save = useCallback(() => {
    setSaving("Saving…");
    const values = { ...latest.current };
    chain.current = chain.current
      .catch(() => {})
      .then(async () => {
        const result = await request("/api/action", {
          action: "save",
          id: initial.id,
          answers: values.answers,
          seconds: values.seconds,
          timings: timings.current,
        });
        if (result.submitted_at) {
          submitted.current = true;
          setAttempt(result);
        }
        setSaving("All changes saved");
        return result;
      });
    return chain.current;
  }, [initial.id]);
  useEffect(() => {
    if (attempt.submitted_at) return;
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") {
        setSeconds((s: number) => s + 1);
        if (focusedQuestion.current)
          timings.current[focusedQuestion.current] =
            (timings.current[focusedQuestion.current] || 0) + 1;
      }
      if (initial.deadline)
        setRemaining(
          Math.max(
            0,
            Math.ceil((Date.parse(initial.deadline) - Date.now()) / 1000),
          ),
        );
    }, 1000);
    return () => clearInterval(timer);
  }, [attempt.submitted_at, initial.deadline]);
  useEffect(() => {
    if (attempt.submitted_at) return;
    const timer = setTimeout(() => {
      void save().catch(() => setSaving("Not saved · reconnect and try again"));
    }, 700);
    return () => clearTimeout(timer);
  }, [answers, attempt.submitted_at, save]);
  useEffect(() => {
    if (attempt.submitted_at) return;
    const timer = setInterval(
      () =>
        void save().catch(() =>
          setSaving("Not saved · reconnect and try again"),
        ),
      10000,
    );
    const warn = (e: BeforeUnloadEvent) => {
      if (!submitted.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => {
      clearInterval(timer);
      window.removeEventListener("beforeunload", warn);
    };
  }, [attempt.submitted_at, save]);
  async function submit() {
    if (busy || submitted.current) return;
    setBusy(true);
    try {
      await save();
      const result = await act({ action: "submit", id: initial.id });
      submitted.current = true;
      setAttempt(result);
    } catch (e) {
      onError((e as Error).message);
      autoSubmit.current = false;
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    if (
      initial.deadline &&
      remaining <= 0 &&
      !submitted.current &&
      !autoSubmit.current
    ) {
      autoSubmit.current = true;
      void submit();
    }
  }, [remaining]);
  if (attempt.result)
    return (
      <>
        <div className="page-heading">
          <div>
            <div className="eyebrow">A STEP FORWARD</div>
            <h1>Practice complete.</h1>
            <p>
              Now comes the part that makes the difference: understanding your
              answers.
            </p>
          </div>
          <button className="outline" onClick={onClose}>
            Return to workspace
          </button>
        </div>
        <div className="result-banner">
          <span className="result-score">
            {attempt.result.correct}
            <small> / {attempt.result.total}</small>
          </span>
          <div>
            <h2>{attempt.result.accuracy}% accuracy</h2>
            <p>
              {attempt.result.label} · {clock(attempt.active_seconds)} active
              study time
            </p>
            <Tag color="green">Saved to your learning history</Tag>
          </div>
          <CheckCircle2 size={42} />
        </div>
        <section className="panel answer-review">
          <h2>Your answer review</h2>
          {attempt.result.review.map((q: Data, i: number) => (
            <div
              className={`review-item ${q.correct ? "correct" : "incorrect"}`}
              key={q.id}
            >
              <div className="row">
                <span className="question-number">{i + 1}</span>
                <h3>{q.text}</h3>
                {q.correct ? (
                  <CheckCircle2 size={19} className="green-text" />
                ) : (
                  <X size={19} className="orange-text" />
                )}
              </div>
              <div className="answer-comparison">
                <span>
                  Your answer: <b>{q.student || "Not answered"}</b>
                </span>
                {!q.correct && (
                  <span>
                    Correct answer: <b>{q.answer}</b>
                  </span>
                )}
              </div>
              <p>{q.explanation}</p>
              {q.evidence && <blockquote>{q.evidence}</blockquote>}
              <EvidencePanel
                attemptId={attempt.id}
                questionId={q.id}
                legacy
                onPractice={onStrategy}
                onError={onError}
              />
            </div>
          ))}
        </section>
        <StrategyReport
          attemptId={attempt.id}
          legacy
          onPractice={onStrategy}
          onError={onError}
          refresh={refresh}
        />
        {attempt.result.transcript && (
          <section className="panel transcript">
            <h2>Listen again, with the transcript</h2>
            <audio controls src={a.audio} />
            <p>{attempt.result.transcript}</p>
          </section>
        )}
      </>
    );
  return (
    <>
      <div className="exam-toolbar">
        <div>
          <Tag color={initial.mode === "strict" ? "orange" : "blue"}>
            {initial.mode === "strict"
              ? "STRICT CHECKPOINT"
              : "GUIDED PRACTICE"}
          </Tag>
          <h1>{a.title}</h1>
          <span className="subtle">
            {a.questions.length} questions · Answers save automatically
          </span>
        </div>
        <div className="exam-timer">
          <Clock size={21} />
          <strong>
            {initial.deadline ? clock(remaining) : clock(seconds)}
          </strong>
          <span>{initial.deadline ? "remaining" : "active time"}</span>
        </div>
      </div>
      <div className="exam-status">
        <span className={saving.startsWith("Not") ? "orange-text" : ""}>
          <ShieldCheck size={14} />
          {saving}
        </span>
        <span>
          {Object.values(answers).filter(Boolean).length}/{a.questions.length}{" "}
          answered
        </span>
        {initial.mode !== "strict" && (
          <button
            className="text-button"
            disabled={busy}
            onClick={async () => {
              try {
                await save();
                onClose();
              } catch {
                onError(
                  "Could not save. Keep this page open and retry when connected.",
                );
              }
            }}
          >
            <Pause size={15} />
            Save & leave
          </button>
        )}
      </div>
      <div className={`exam-layout ${a.passage ? "split" : ""}`}>
        {a.passage && (
          <section className="panel passage-panel">
            <div className="section-heading">
              <h2>Reading passage</h2>
              <div className="row">
                <button
                  className="icon-button"
                  aria-label="Decrease font size"
                  onClick={() => setFont(Math.max(14, font - 1))}
                >
                  A−
                </button>
                <button
                  className="icon-button"
                  aria-label="Increase font size"
                  onClick={() => setFont(Math.min(24, font + 1))}
                >
                  A+
                </button>
                <button
                  className={`icon-button ${highlight ? "active" : ""}`}
                  aria-label="Toggle passage highlighting"
                  onClick={() => setHighlight(!highlight)}
                >
                  <PenLine size={16} />
                </button>
              </div>
            </div>
            <p className="subtle">
              {highlight
                ? "Select text to mark it. Highlights are local to this session."
                : "Read the passage and decide what it actually establishes."}
            </p>
            <div
              className="passage"
              style={{ fontSize: font }}
              onMouseUp={() => {
                if (!highlight) return;
                const sel = window.getSelection();
                if (sel?.rangeCount && sel.toString()) {
                  const range = sel.getRangeAt(0);
                  if (
                    range.commonAncestorContainer.parentElement?.closest(
                      ".passage",
                    )
                  ) {
                    try {
                      const mark = document.createElement("mark");
                      range.surroundContents(mark);
                      sel.removeAllRanges();
                    } catch {}
                  }
                }
              }}
            >
              {a.passage.split("\n\n").map((p: string, i: number) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </section>
        )}
        <section className="panel questions-panel">
          {a.audio && (
            <div className="audio-panel">
              <div className="row">
                <span className="skill-icon blue">
                  <Headphones size={23} />
                </span>
                <div>
                  <h3>Listen to the workshop information</h3>
                  <p>
                    Replay is available in practice mode. Transcript appears
                    after submission.
                  </p>
                </div>
              </div>
              <audio
                controls
                preload="metadata"
                src={a.audio}
                onError={() => setAudioError(true)}
              />
              {audioError && (
                <p className="callout warning">
                  Audio is unavailable. Please reload or check your connection
                  before answering.
                </p>
              )}
              <span className="subtle">
                Original content · Synthetic English voice
              </span>
            </div>
          )}
          <div className="question-navigator">
            {a.questions.map((q: Data, i: number) => (
              <a
                key={q.id}
                className={`${answers[q.id] ? "answered" : ""} ${flags.includes(q.id) ? "flagged" : ""}`}
                href={`#question-${q.id}`}
              >
                {i + 1}
              </a>
            ))}
          </div>
          <h2>
            {a.skill === "Reading"
              ? "True, False, or Not Given"
              : a.skill === "Listening"
                ? "Complete the details"
                : "Choose the best answer"}
          </h2>
          <p className="subtle">
            {a.skill === "Reading"
              ? "Use only information from the passage. Do not use outside knowledge."
              : "Read each instruction carefully before answering."}
          </p>
          {a.questions.map((q: Data, i: number) => (
            <fieldset
              className="question"
              key={q.id}
              id={`question-${q.id}`}
              onFocusCapture={() => {
                focusedQuestion.current = q.id;
              }}
              onMouseEnter={() => {
                focusedQuestion.current = q.id;
              }}
            >
              <legend>
                <span className="question-number">{i + 1}</span>
                {q.text}
              </legend>
              <button
                type="button"
                className={`flag-button ${flags.includes(q.id) ? "active" : ""}`}
                aria-label={`Flag question ${i + 1} for review`}
                onClick={() =>
                  setFlags(
                    flags.includes(q.id)
                      ? flags.filter((f) => f !== q.id)
                      : [...flags, q.id],
                  )
                }
              >
                <Flag size={15} />
              </button>
              {q.options ? (
                <div className="options">
                  {q.options.map((option: string) => (
                    <label
                      className={answers[q.id] === option ? "chosen" : ""}
                      key={option}
                    >
                      <input
                        type="radio"
                        name={q.id}
                        checked={answers[q.id] === option}
                        onChange={() =>
                          setAnswers({ ...answers, [q.id]: option })
                        }
                      />
                      {option}
                    </label>
                  ))}
                </div>
              ) : (
                <input
                  className="text-answer"
                  aria-label={`Answer ${i + 1}`}
                  value={answers[q.id] || ""}
                  maxLength={200}
                  onChange={(e) =>
                    setAnswers({ ...answers, [q.id]: e.target.value })
                  }
                  placeholder="Your answer"
                />
              )}
            </fieldset>
          ))}
          <div className="submit-panel">
            <p>
              {a.questions.length -
                Object.values(answers).filter(Boolean).length}{" "}
              unanswered questions. You can submit incomplete work; unanswered
              items receive no mark.
            </p>
            <button
              className="primary"
              disabled={busy}
              onClick={() => void submit()}
            >
              <CheckCircle2 size={17} />
              {busy ? "Submitting…" : "Submit & review answers"}
            </button>
          </div>
        </section>
      </div>
    </>
  );
}
