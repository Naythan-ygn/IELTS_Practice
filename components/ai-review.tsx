"use client";
import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { request, Tag } from "./ui";
import type { Data } from "./ui";
export function AIReviewPanel({
  kind,
  sourceId,
  questionId = "",
  onError,
}: Data) {
  const [feedback, setFeedback] = useState<Data | null>(null),
    [ai, setAI] = useState<Data | null>(null),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  useEffect(() => {
    let cancelled = false;
    request(
      `/api/ai-review?kind=${encodeURIComponent(kind)}&sourceId=${encodeURIComponent(sourceId)}&questionId=${encodeURIComponent(questionId)}`,
    )
      .then((s) => {
        if (!cancelled) {
          setAI(s.ai);
          setFeedback(s.review);
        }
      })
      .catch(() => {
        if (!cancelled)
          setError(
            "Could not load AI configuration. Reload the page to retry.",
          );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [kind, sourceId, questionId]);
  async function analyse() {
    setBusy(true);
    setError("");
    try {
      const result = await request(
        "/api/tutor",
        kind === "recording"
          ? { recordingId: sourceId }
          : { attemptId: sourceId, attemptSource: kind, questionId },
      );
      setFeedback({
        response: result.answer,
        provider: result.provider,
        model: result.model,
        created_at: new Date().toISOString(),
      });
    } catch (e) {
      setError((e as Error).message);
      onError?.((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="ai-answer-review">
      <button
        className="outline"
        disabled={busy || !ai?.enabled}
        onClick={() => void analyse()}
      >
        <Sparkles size={16} />
        {busy
          ? "Analysing…"
          : feedback
            ? "Refresh AI analysis"
            : kind === "recording"
              ? "Analyse transcript with AI"
              : "Analyse my answer with AI"}
      </button>
      <p className="subtle">
        {loading
          ? "Loading saved AI feedback…"
          : ai?.enabled
            ? `On request, the selected answer and relevant source are shared with ${ai.provider} and its model provider. ${kind === "recording" ? "Text only; audio and pronunciation are not assessed." : "Your verified practice score stays unchanged."}`
            : "Configure OpenRouter in the server’s .env.local file to enable AI analysis."}
      </p>
      {error && <p role="alert">{error}</p>}
      {feedback && (
        <div className="feedback-text">
          <Tag color="violet">
            AI FEEDBACK · {feedback.provider} · UNOFFICIAL
          </Tag>
          <p>{feedback.response}</p>
        </div>
      )}
    </div>
  );
}
