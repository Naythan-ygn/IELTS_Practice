"use client";
import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import type { Data } from "./ui";
import { Tag, request } from "./ui";
import { strategyRequest } from "./strategy-workspace";
export function StrategyReport({
  attemptId,
  legacy = false,
  onError,
  refresh,
}: Data) {
  const [report, setReport] = useState<Data | null>(null),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  useEffect(() => {
    request(
      `/api/strategy?report=1&attempt=${attemptId}&legacy=${legacy ? "1" : "0"}`,
    )
      .then(setReport)
      .catch((e) => setMessage(e.message));
  }, [attemptId, legacy]);
  if (!report)
    return (
      <section className="panel">
        <p>{message || "Preparing your strategy report…"}</p>
      </section>
    );
  return (
    <section className="panel strategy-report">
      <Tag color="violet">{report.label}</Tag>
      <h2>{report.title}</h2>
      <p>
        {report.correct}/{report.total} correct · {report.unanswered} unanswered
        · Band: {report.band ?? "Not estimated for short practice"}
      </p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Question type</th>
              <th>Correct</th>
              <th>Accuracy</th>
            </tr>
          </thead>
          <tbody>
            {report.types.map((t: Data) => (
              <tr key={t.name}>
                <td>{t.name}</td>
                <td>
                  {t.correct}/{t.total}
                </td>
                <td>{Math.round((t.correct / t.total) * 100)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h3>What the evidence supports</h3>
      <p>{report.success}</p>
      <h3>Timing and missed opportunities</h3>
      <p>{report.timeManagement}</p>
      <p>{report.recommendation}</p>
      <p>{report.nextDay}</p>
      <button
        className="primary"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            const m = await strategyRequest({
              action: "micro",
              sourceAttempt: attemptId,
            });
            await refresh?.();
            setMessage(
              `Created “${m.title}”. Open Strategy Playbook to use it. The source result is unchanged.`,
            );
          } catch (e) {
            onError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <Sparkles size={16} />
        Turn my mistakes into practice
      </button>
      {message && <p className="callout">{message}</p>}
    </section>
  );
}
