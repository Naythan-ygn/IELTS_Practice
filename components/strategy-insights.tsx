"use client";
import { useState } from "react";
import { Compass, Target, Sparkles, TriangleAlert, Save } from "lucide-react";
import { Tag, PageHeading, Empty, skillColors } from "./ui";
import type { Data } from "./ui";
import { strategyRequest } from "./strategy-workspace";
export function StrategyHeatmap({ data, onPractice }: Data) {
  const [skill, setSkill] = useState("All"),
    [showAll, setShowAll] = useState(false);
  const a = data.strategy.analytics.filter(
    (a: Data) =>
      (skill === "All" || a.skill === skill) &&
      (showAll || a.available || a.total > 0),
  );
  return (
    <section className="panel strategy-heatmap">
      <div className="section-heading">
        <div>
          <h2>Question types, not just skill totals.</h2>
          <p>
            Strategy reasoning and exam practice are identified separately.
            Small samples are provisional.
          </p>
        </div>
        <select
          aria-label="Heatmap skill"
          value={skill}
          onChange={(e) => setSkill(e.target.value)}
        >
          {[
            "All",
            "Listening",
            "Reading",
            "Writing",
            "Speaking",
            "Grammar",
            "Vocabulary",
          ].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>
      <label className="row">
        <input
          type="checkbox"
          checked={showAll}
          onChange={(e) => setShowAll(e.target.checked)}
        />
        Include reference-only types with no dedicated practice bank
      </label>
      <div className="heatmap-grid">
        {a.map((v: Data) => (
          <button
            className={`heatmap-cell ${v.accuracy === null ? "no-data" : v.accuracy >= 80 ? "strong" : v.accuracy >= 60 ? "developing" : "review"}`}
            key={v.patternId}
            onClick={() => onPractice?.(v.strategyId, "guided")}
            disabled={!onPractice || !v.available}
          >
            <span>{v.skill}</span>
            <h3>{v.name}</h3>
            <strong>
              {v.accuracy === null ? "Not assessed" : `${v.accuracy}%`}
            </strong>
            <p>
              {v.total} responses · {v.uniqueQuestions} distinct questions
            </p>
            <small>
              {v.averageSeconds === null
                ? "Response time not measured"
                : `${v.averageSeconds}s average · ${v.measuredResponses} measured`}
            </small>
            <small>
              Recent: {v.recent === null ? "—" : `${v.recent}%`} · {v.mastery}
            </small>
            {v.total > 0 && v.total < 10 && (
              <small>Small sample — keep practising</small>
            )}
          </button>
        ))}
      </div>
      <details className="analytics-detail">
        <summary>View error patterns and revision recommendations</summary>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Question type</th>
                <th>Correct / total</th>
                <th>Common error type</th>
                <th>Recommended revision</th>
              </tr>
            </thead>
            <tbody>
              {a
                .filter((v: Data) => v.total)
                .map((v: Data) => (
                  <tr key={v.patternId}>
                    <td>{v.name}</td>
                    <td>
                      {v.correct}/{v.total}
                    </td>
                    <td>{v.commonErrors.join("; ") || "No recorded errors"}</td>
                    <td>{v.recommendation}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </details>
      <p className="subtle">
        Mastery: ≥10 distinct independent and ≥5 distinct timed questions, at
        least 80% correct in each. Legacy results lack per-question timing; no
        time is invented.
      </p>
    </section>
  );
}
export function StrategyDashboard({
  data,
  catalog,
  day,
  onNavigate,
  onPractice,
}: Data) {
  const l = catalog.course[day - 1],
    s = catalog.strategies.find((s: Data) => s.id === l.strategyId),
    weak = data.strategy.analytics
      .filter((a: Data) => a.total > 0)
      .sort((a: Data, b: Data) => a.accuracy - b.accuracy),
    mastered = data.strategy.analytics.filter(
      (a: Data) => a.mastery === "Mastered strategy practice",
    ).length;
  return (
    <section className="panel dashboard-strategy">
      <div className="section-heading">
        <div>
          <Tag>STRATEGY OF THE DAY</Tag>
          <h2>{s.name}</h2>
          <p>{s.explanation}</p>
        </div>
        <button
          className="outline"
          onClick={() => onNavigate("Strategy Playbook")}
        >
          <Compass size={16} />
          Open playbook
        </button>
      </div>
      <div className="strategy-dashboard-facts">
        <div>
          <span>Today’s question types</span>
          <b>
            {catalog.patterns.find((p: Data) => p.strategyId === s.id)?.name}
          </b>
        </div>
        <div>
          <span>Strategy mastery</span>
          <b>{mastered} evidence-backed paths</b>
        </div>
        <div>
          <span>Common trap alert</span>
          <b>
            {catalog.patterns.find((p: Data) => p.strategyId === s.id)?.trap}
          </b>
        </div>
      </div>
      {weak.length > 0 && (
        <p className="weakest-types">
          <Target size={16} />
          Weakest observed type:{" "}
          <strong>
            {weak[0].name} · {weak[0].accuracy}% ({weak[0].total} responses)
          </strong>
          <button
            className="text-button"
            onClick={() => onPractice(weak[0].strategyId, "guided")}
          >
            Review
          </button>
        </p>
      )}
      {!weak.length && (
        <p className="subtle">
          Complete strategy practice to reveal your question-type strengths and
          revision needs.
        </p>
      )}
    </section>
  );
}
export function ScorePlanner({ data, refresh, onError }: Data) {
  const names = ["Listening", "Reading", "Writing", "Speaking"],
    [scores, setScores] = useState<Record<string, string>>(
      Object.fromEntries(names.map((n) => [n, ""])),
    ),
    [mins, setMins] = useState<Record<string, string>>(
      Object.fromEntries(names.map((n) => [n, ""])),
    ),
    [raw, setRaw] = useState<Record<string, string>>({
      Listening: "",
      Reading: "",
    }),
    [target, setTarget] = useState(String(data.profile.target)),
    [result, setResult] = useState<Data | null>(null),
    [busy, setBusy] = useState(false);
  return (
    <>
      <PageHeading
        eyebrow="BAND 6.5 SCORE PLANNING"
        title="Plan the whole picture."
        description="Explore an estimated combination while keeping minimum section requirements in view."
      />
      <section className="panel score-planner">
        <div className="callout">
          <strong>Planning inputs, not assessment results.</strong>
          <p>
            Enter your latest externally assessed mock estimates or a
            hypothetical scenario. We keep these values separate from saved app
            performance.
          </p>
        </div>
        <label className="score-target">
          Overall target
          <select value={target} onChange={(e) => setTarget(e.target.value)}>
            {Array.from({ length: 19 }, (_, i) => i / 2).map((n) => (
              <option key={n}>{n.toFixed(1)}</option>
            ))}
          </select>
        </label>
        <div className="score-input-grid">
          {names.map((name) => (
            <div key={name}>
              <h3>{name}</h3>
              <label>
                Estimated section band
                <select
                  value={scores[name]}
                  onChange={(e) =>
                    setScores({ ...scores, [name]: e.target.value })
                  }
                >
                  <option value="">Not assessed</option>
                  {Array.from({ length: 19 }, (_, i) => i / 2).map((n) => (
                    <option key={n}>{n.toFixed(1)}</option>
                  ))}
                </select>
              </label>
              <label>
                Minimum required (optional)
                <select
                  value={mins[name]}
                  onChange={(e) => setMins({ ...mins, [name]: e.target.value })}
                >
                  <option value="">No minimum entered</option>
                  {Array.from({ length: 19 }, (_, i) => i / 2).map((n) => (
                    <option key={n}>{n.toFixed(1)}</option>
                  ))}
                </select>
              </label>
              {["Listening", "Reading"].includes(name) && (
                <label>
                  Raw marks out of 40 (optional)
                  <input
                    type="number"
                    min="0"
                    max="40"
                    value={raw[name]}
                    onChange={(e) => setRaw({ ...raw, [name]: e.target.value })}
                  />
                </label>
              )}
            </div>
          ))}
        </div>
        <div className="row score-actions">
          <button
            className="primary"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                setResult(
                  await strategyRequest({
                    action: "score",
                    scenario: { target, scores, minimums: mins, raw },
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
            {busy ? "Calculating…" : "Calculate & save scenario"}
          </button>
          <button
            className="outline"
            onClick={() => {
              setScores({
                Listening: "7.0",
                Reading: "7.0",
                Writing: "6.0",
                Speaking: "6.0",
              });
              setResult(null);
            }}
          >
            Try the 7 / 7 / 6 / 6 example
          </button>
        </div>
        <p className="subtle">
          One possible combination, not a compulsory distribution or a
          prediction of your results.
        </p>
      </section>
      {result && (
        <section className="panel score-result">
          <Tag color="violet">{result.label}</Tag>
          <h2>
            {result.overall === null
              ? "Overall: not assessed"
              : `Estimated overall: ${result.overall.toFixed(1)}`}
          </h2>
          <p>{result.explanation}</p>
          {result.overall === null && (
            <p className="callout">
              Enter all four components before an overall estimate is
              calculated.
            </p>
          )}
          <div className="score-requirements">
            {result.requirements.map((r: Data) => (
              <div key={r.name}>
                <strong>{r.name}</strong>
                <span>
                  {r.score === null ? "Not assessed" : r.score.toFixed(1)}
                </span>
                <Tag
                  color={
                    r.met === false
                      ? "orange"
                      : r.met === true
                        ? "green"
                        : "neutral"
                  }
                >
                  {r.met === null
                    ? "No check available"
                    : r.met
                      ? "Minimum met"
                      : "Below minimum"}
                </Tag>
              </div>
            ))}
          </div>
          {result.targetMet !== null && (
            <p>
              <strong>
                {result.targetMet
                  ? "This entered combination meets the overall target."
                  : "This entered combination is below the overall target."}
              </strong>
            </p>
          )}
          {result.priorities.map((p: string) => (
            <p className="callout warning" key={p}>
              {p}
            </p>
          ))}
          {result.rawConversions &&
            Object.entries(result.rawConversions).map(
              ([skill, r]: [string, any]) => (
                <p key={skill}>
                  {skill}: {r.correct}/40 → approximately Band {r.band}.{" "}
                  <span className="subtle">{r.label}</span>
                </p>
              ),
            )}
          <p>
            Preparation priorities should consider your available{" "}
            {data.profile.hours} daily study hours, repeated errors and the
            uncertainty of each estimate. No mark improvement is guaranteed.
          </p>
        </section>
      )}
      <section className="panel">
        <h2>Saved planning scenarios</h2>
        {data.strategy.scenarios.length ? (
          <div className="micro-list">
            {data.strategy.scenarios.map((s: Data) => (
              <button key={s.id} onClick={() => setResult(s.data)}>
                <span>
                  <b>
                    Target {s.data.target.toFixed(1)} · Overall{" "}
                    {s.data.overall === null
                      ? "Not assessed"
                      : s.data.overall.toFixed(1)}
                  </b>
                  <small>{new Date(s.created_at).toLocaleString()}</small>
                </span>
                <Tag color="neutral">Scenario</Tag>
              </button>
            ))}
          </div>
        ) : (
          <Empty icon={Target} title="Test a combination, then save it">
            Entered scenarios never overwrite practice history or create
            official results.
          </Empty>
        )}
      </section>
    </>
  );
}
