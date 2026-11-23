"use client";
import { useEffect, useState } from "react";
import { PenLine, Sparkles, Save, Clock } from "lucide-react";
import { Tag, request, clock } from "./ui";
import type { Data } from "./ui";
import { strategyRequest } from "./strategy-workspace";
const modes: Record<string, { instruction: string; example: string }> = {
  "Essay Planning": {
    instruction:
      "Identify every task requirement. Choose a position, two reasons and a relevant example for each.",
    example:
      "Position: prioritise public transport. Reason: access for non-drivers. Example: frequent buses connecting homes to hospitals.",
  },
  "Introduction Builder": {
    instruction:
      "Paraphrase the actual issue and state your response. Avoid a generic opening unrelated to the task.",
    example:
      "Whether governments should prioritise public transport over new roads is debated. I largely support public transport because it can improve access and reduce dependence on cars.",
  },
  "Thesis Trainer": {
    instruction:
      "State a clear, defensible degree of agreement. Ensure the body ideas will support it.",
    example:
      "I largely agree that public transport deserves priority, although essential road maintenance should continue.",
  },
  "Paragraph Development": {
    instruction:
      "Develop one point with an explanation and a relevant example. Explain how the example supports your point.",
    example:
      "Frequent buses can improve access to employment. People without cars can reach jobs farther from home, particularly when services connect residential areas to workplaces.",
  },
  "Grammar Correction": {
    instruction:
      "Check the head noun, verb agreement and sentence boundary. Explain the grammar behind each revision.",
    example:
      "Original: The number of commuters are rising. Revision: The number of commuters is rising. Reason: number is the singular head noun.",
  },
  "Full Timed Essay": {
    instruction:
      "Plan, write at least 250 words, then check task coverage and accuracy. The practice timer is a pacing aid, not a strict examination.",
    example:
      "Use about five minutes to plan, thirty to draft and five to review. Adjust this heuristic to your pace.",
  },
  "Rewrite & Improve": {
    instruction:
      "Keep your original. Improve one aspect at a time and explain why each change makes the meaning clearer.",
    example:
      "Original: Buses are very good things. Revision: Frequent bus services give people without cars better access to work. Reason: the revision states a specific benefit.",
  },
};
export function WritingCoach({ data, refresh, onError }: Data) {
  const [mode, setMode] = useState("Essay Planning"),
    [original, setOriginal] = useState(""),
    [revision, setRevision] = useState(""),
    [reason, setReason] = useState(""),
    [feedback, setFeedback] = useState<Data | null>(null),
    [ai, setAi] = useState(""),
    [busy, setBusy] = useState(false),
    [seconds, setSeconds] = useState<number | null>(null);
  const prompt =
    "Governments should invest more in public transport than new roads. To what extent do you agree or disagree?";
  useEffect(() => {
    const saved = data.strategy.coaching.find((c: Data) => c.mode === mode);
    setOriginal(saved?.original || "");
    setRevision(saved?.revision || "");
    setReason(saved?.reason || "");
    setFeedback(saved?.feedback || null);
    setAi("");
    setSeconds(null);
  }, [mode]);
  useEffect(() => {
    if (seconds === null || seconds <= 0) return;
    const t = setTimeout(() => setSeconds(seconds - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);
  return (
    <section className="panel writing-coach">
      <div className="section-heading">
        <div>
          <Tag color="violet">INTERACTIVE WRITING COACH</Tag>
          <h2>Build the response before polishing it.</h2>
        </div>
        <PenLine size={24} />
      </div>
      <div className="coach-mode-tabs">
        {Object.keys(modes).map((m) => (
          <button
            className={m === mode ? "active" : ""}
            key={m}
            onClick={() => setMode(m)}
          >
            {m}
          </button>
        ))}
      </div>
      <p>
        <strong>Practice prompt:</strong> {prompt}
      </p>
      <div className="worked-example">
        <span>{mode.toUpperCase()}</span>
        <p>{modes[mode].instruction}</p>
        <p>{modes[mode].example}</p>
      </div>
      {mode === "Full Timed Essay" && (
        <div className="row coach-timer">
          <Clock size={18} />
          <strong>{seconds === null ? "40:00" : clock(seconds)}</strong>
          <button
            className="outline"
            onClick={() => setSeconds(seconds === null ? 2400 : null)}
          >
            {seconds === null ? "Start pacing timer" : "Reset timer"}
          </button>
          {seconds === 0 && (
            <span>Time is up. Review and save your draft.</span>
          )}
        </div>
      )}
      <div className="coach-original-revision">
        <label>
          Your original
          <textarea
            rows={8}
            value={original}
            onChange={(e) => setOriginal(e.target.value)}
            placeholder="Write your own plan, sentence, paragraph or essay…"
          />
        </label>
        <label>
          Your suggested revision
          <textarea
            rows={8}
            value={revision}
            onChange={(e) => setRevision(e.target.value)}
            placeholder="Revise here while keeping the original visible…"
          />
        </label>
      </div>
      <label>
        Why is the revision more effective?
        <textarea
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="I made this change because…"
        />
      </label>
      <div className="row coach-actions">
        <button
          className="primary"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              setFeedback(
                await strategyRequest({
                  action: "coach",
                  mode,
                  prompt,
                  original,
                  revision,
                  reason,
                }),
              );
              await refresh();
            } catch (e) {
              onError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <Save size={16} />
          Save & self-review
        </button>
        <button
          className="outline"
          disabled={busy || !data.aiEnabled || original.trim().length < 20}
          onClick={async () => {
            setBusy(true);
            try {
              const result = await request("/api/tutor", {
                message: `Writing coach mode: ${mode}. Prompt: ${prompt}. Original: ${original}. Suggested revision: ${revision}. Learner's reason: ${reason}. Explain specific issues, suggested changes and why they help. Use Task Response, Coherence and Cohesion, Lexical Resource, Grammatical Range and Accuracy. Do not assign a full essay band to a sentence or outline. If sufficient essay evidence exists, label any estimate unofficial and uncertain.`,
              });
              setAi(result.answer);
              await refresh();
            } catch (e) {
              onError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <Sparkles size={16} />
          Request AI feedback
        </button>
      </div>
      {feedback && (
        <div className="coach-review">
          <Tag color="neutral">{feedback.label}</Tag>
          <p>
            {feedback.checks.words} words · {feedback.checks.paragraphs}{" "}
            paragraphs. Counts are structural observations, not quality scores.
          </p>
          <ul>
            {feedback.criteria.map((c: string) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
          <p>{feedback.suggestion}</p>
        </div>
      )}
      {ai && (
        <div className="feedback-text">
          <Tag color="orange">AI FEEDBACK · UNOFFICIAL</Tag>
          <p>{ai}</p>
        </div>
      )}
      {!data.aiEnabled && (
        <p className="subtle">
          Specific AI corrections and criterion estimates require the existing
          server AI connection. The checklist does not pretend your language has
          been automatically assessed.
        </p>
      )}
    </section>
  );
}
