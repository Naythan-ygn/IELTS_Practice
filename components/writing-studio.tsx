"use client";
import {
  CheckCircle2,
  Clock,
  Lightbulb,
  Play,
  ShieldCheck,
  Sparkles,
  Square,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Data } from "./ui";
import { clock, countWords, PageHeading, request, Tag } from "./ui";
import { WritingCoach } from "./writing-coach";
export function WritingStudio({
  prompts,
  data,
  day,
  act,
  refresh,
  onError,
  onNotice,
}: Data) {
  const [selected, setSelected] = useState(prompts[0].id),
    [text, setText] = useState(""),
    [status, setStatus] = useState("Draft saved"),
    [busy, setBusy] = useState(false),
    [aiBusy, setAiBusy] = useState(false),
    [timer, setTimer] = useState<number | null>(null),
    [saving, setSaving] = useState(false);
  const prompt = prompts.find((p: Data) => p.id === selected),
    saved = data.writing.find((w: Data) => w.prompt_id === selected),
    min = prompt.task === 1 ? 150 : 250,
    words = countWords(text),
    current = useRef(text),
    chain = useRef<Promise<any>>(Promise.resolve());
  current.current = text;
  useEffect(() => {
    setText(
      data.writing.find((w: Data) => w.prompt_id === selected)?.body || "",
    );
    setStatus("Draft saved");
    setTimer(null);
  }, [selected]);
  const persist = useCallback(
    async (body: string, submit = false) => {
      setSaving(true);
      setStatus("Saving…");
      chain.current = chain.current
        .catch(() => {})
        .then(async () => {
          const value = await request("/api/action", {
            action: "writing",
            prompt: selected,
            body,
            submit,
            day,
          });
          setStatus(submit ? "Response submitted" : "Draft saved");
          return value;
        });
      try {
        return await chain.current;
      } catch (e) {
        setStatus("Not saved · reconnect to retry");
        throw e;
      } finally {
        setSaving(false);
      }
    },
    [selected, day],
  );
  useEffect(() => {
    if (text === (saved?.body || "")) return;
    const t = setTimeout(() => void persist(text).catch(() => {}), 900);
    return () => clearTimeout(t);
  }, [text, selected, persist]);
  useEffect(() => {
    if (timer === null || timer <= 0) return;
    const t = setInterval(
      () => setTimer((n) => (n === null ? null : Math.max(0, n - 1))),
      1000,
    );
    return () => clearInterval(t);
  }, [timer !== null && timer > 0]);
  return (
    <>
      <PageHeading
        eyebrow="WRITING STUDIO"
        title="Good writing starts with an idea."
        description="Plan, draft, and refine. Your own voice comes first."
      />
      <WritingCoach data={data} refresh={refresh} onError={onError} />
      <div className="studio-toolbar">
        <label>
          Practice prompt
          <select
            value={selected}
            onChange={async (e) => {
              const next = e.target.value;
              try {
                await persist(text);
                await refresh();
                setSelected(next);
              } catch (err) {
                onError((err as Error).message);
              }
            }}
          >
            {prompts.map((p: Data) => (
              <option key={p.id} value={p.id}>
                Task {p.task} · {p.title}
              </option>
            ))}
          </select>
        </label>
        <div className="row">
          <span className="timer-label">
            <Clock size={17} />
            {timer === null
              ? `${prompt.task === 1 ? 20 : 40}:00`
              : clock(timer)}
          </span>
          <button
            className="outline"
            onClick={() =>
              setTimer(
                timer === null ? (prompt.task === 1 ? 1200 : 2400) : null,
              )
            }
          >
            {timer === null ? <Play size={14} /> : <Square size={14} />}{" "}
            {timer === null ? "Start practice timer" : "Reset timer"}
          </button>
        </div>
      </div>
      <div className="writing-layout">
        <section className="panel writing-prompt">
          <Tag color="orange">ACADEMIC WRITING · TASK {prompt.task}</Tag>
          <h2>{prompt.title}</h2>
          <p>{prompt.prompt}</p>
          {prompt.data && (
            <>
              <div className="writing-chart">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart
                    data={prompt.data}
                    margin={{ top: 20, right: 15, bottom: 5, left: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 4" vertical={false} />
                    <XAxis dataKey="city" tickLine={false} axisLine={false} />
                    <YAxis
                      domain={[0, 40]}
                      unit="%"
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="before"
                      name="2010"
                      fill="#c8d8ff"
                      radius={[5, 5, 0, 0]}
                    />
                    <Bar
                      dataKey="after"
                      name="2020"
                      fill="#1659fc"
                      radius={[5, 5, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="chart-caption">
                Commuters cycling to work (%). Original illustrative dataset.
              </p>
              <details>
                <summary>View accessible data table</summary>
                <table>
                  <thead>
                    <tr>
                      <th>City</th>
                      <th>2010</th>
                      <th>2020</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prompt.data.map((d: Data) => (
                      <tr key={d.city}>
                        <td>{d.city}</td>
                        <td>{d.before}%</td>
                        <td>{d.after}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </details>
            </>
          )}
          <div className="worked-example">
            <span>
              <Lightbulb size={16} />
              BEFORE YOU WRITE
            </span>
            <p>
              {prompt.task === 1
                ? "Identify the overall pattern. Select the most important comparisons. Keep every figure accurate."
                : "Take a clear position. Plan one main idea per paragraph and explain your examples."}
            </p>
          </div>
          <p className="subtle">
            Write at least {min} words. Recommended time:{" "}
            {prompt.task === 1 ? 20 : 40} minutes. Task 2 carries twice the
            weight of Task 1 in a full Writing assessment.
          </p>
        </section>
        <section className="panel editor-panel">
          <div className="section-heading">
            <h3>Your response</h3>
            <span className="save-status">
              <ShieldCheck size={14} />
              {status}
            </span>
          </div>
          <textarea
            className="writing-editor"
            aria-label="Your writing response"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              prompt.task === 1
                ? "The chart illustrates…"
                : "Start with your introduction…"
            }
            spellCheck
            maxLength={30000}
          />
          <div className="editor-bottom">
            <span className={words >= min ? "green-text" : "subtle"}>
              <strong>{words}</strong> / {min} words minimum
            </span>
            <span>{text.length.toLocaleString()} characters</span>
          </div>
          {timer === 0 && (
            <div className="callout warning">
              Practice time has ended. Save or submit your work when ready. This
              is an untimed learning submission, not a strict exam.
            </div>
          )}
          <div className="row editor-actions">
            <button
              className="outline"
              disabled={busy || saving}
              onClick={async () => {
                try {
                  await persist(text);
                  await refresh();
                  onNotice("Draft saved. You can return anytime.");
                } catch (e) {
                  onError((e as Error).message);
                }
              }}
            >
              Save draft
            </button>
            <button
              className="primary"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await persist(text, true);
                  await refresh();
                  onNotice(
                    "Response submitted. Use the checklist below to review your work.",
                  );
                } catch (e) {
                  onError((e as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              <CheckCircle2 size={16} />
              {busy ? "Submitting…" : "Submit response"}
            </button>
          </div>
        </section>
      </div>
      <section className="panel writing-feedback">
        <div className="section-heading">
          <div>
            <Tag color="violet">REFLECT & REFINE</Tag>
            <h2>Your feedback space</h2>
          </div>
          {saved?.submitted_at && (
            <button
              className="primary"
              disabled={aiBusy || text !== saved.body}
              onClick={async () => {
                setAiBusy(true);
                try {
                  await request("/api/tutor", { writingId: saved.id });
                  await refresh();
                } catch (e) {
                  onError((e as Error).message);
                } finally {
                  setAiBusy(false);
                }
              }}
            >
              <Sparkles size={16} />
              {aiBusy ? "Reviewing…" : "Request AI feedback"}
            </button>
          )}
        </div>
        {saved?.feedback ? (
          <div className="feedback-text">
            <Tag color="orange">AI ESTIMATE · UNOFFICIAL</Tag>
            <p>{saved.feedback.text}</p>
          </div>
        ) : (
          <>
            <p>
              {data.aiEnabled
                ? "Submit your response, then request criterion-based AI feedback."
                : "AI feedback is not connected. Your drafts and submissions are saved; no band score will be invented."}
            </p>
            <div className="criteria-grid">
              {[
                prompt.task === 1 ? "Task Achievement" : "Task Response",
                "Coherence & Cohesion",
                "Lexical Resource",
                "Grammatical Range & Accuracy",
              ].map((c, i) => (
                <div key={c}>
                  <span className="criteria-number">0{i + 1}</span>
                  <h3>{c}</h3>
                  <p>
                    {
                      [
                        "Have you addressed every part of the prompt?",
                        "Does each paragraph have a clear focus?",
                        "Are your words precise and natural?",
                        "Have you checked agreement, tense, and sentence boundaries?",
                      ][i]
                    }
                  </p>
                </div>
              ))}
            </div>
            <p className="subtle">
              AI integration: set AI_PROVIDER=openrouter and OPENROUTER_API_KEY
              on the server. Automated estimates are uncertain and are not
              official examiner scores.
            </p>
          </>
        )}
      </section>
    </>
  );
}
