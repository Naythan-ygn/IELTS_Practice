"use client";
import {
  ChartNoAxesCombined,
  CheckCircle2,
  Clock,
  NotebookPen,
  RotateCcw,
  Target,
} from "lucide-react";
import { useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Data } from "./ui";
import { dateLabel, Empty, PageHeading, ResultTable, Stat, Tag } from "./ui";
import { StrategyHeatmap } from "./strategy-insights";
export function Analytics({ data, onReview, onStrategy }: Data) {
  const [range, setRange] = useState("30");
  const all = data.attempts.filter((a: Data) => a.submitted_at),
    attempts = all.filter(
      (a: Data) =>
        range === "all" ||
        Date.parse(a.submitted_at) > Date.now() - Number(range) * 86400000,
    ),
    plot = [...attempts].reverse().map((a: Data) => ({
      name: dateLabel(a.submitted_at),
      accuracy: a.result.accuracy,
      skill: a.skill,
    }));
  const mistakes: Record<string, number> = {};
  data.mistakes.forEach((m: Data) => {
    mistakes[m.category] = (mistakes[m.category] || 0) + m.repetitions;
  });
  return (
    <>
      <PageHeading
        eyebrow="YOUR PROGRESS, WITH PERSPECTIVE"
        title="See what’s taking shape."
        description="Real practice. Real evidence. Every result is a starting point for the next step."
      />
      <StrategyHeatmap data={data} onPractice={onStrategy} />
      <div className="practice-toolbar">
        <Tag color="neutral">All estimates are unofficial</Tag>
        <label className="filter-label">
          Show
          <select value={range} onChange={(e) => setRange(e.target.value)}>
            <option value="7">Last 7 days</option>
            <option value="14">Last 14 days</option>
            <option value="30">Last 30 days</option>
            <option value="all">Entire preparation</option>
          </select>
        </label>
      </div>
      <div className="stats-grid">
        <Stat
          icon={Target}
          label="Target band"
          value={data.profile.target.toFixed(1)}
          detail="Your personal goal"
          color="blue"
        />
        <Stat
          icon={ChartNoAxesCombined}
          label="Overall estimated band"
          value="Not assessed"
          detail="Evidence needed for all four skills"
          color="violet"
        />
        <Stat
          icon={CheckCircle2}
          label="Completed practices"
          value={String(attempts.length)}
          detail="In the selected period"
          color="teal"
        />
        <Stat
          icon={Clock}
          label="Active study time"
          value={`${(attempts.reduce((s: number, a: Data) => s + a.active_seconds, 0) / 3600).toFixed(1)} hrs`}
          detail="Recorded in objective activities"
          color="orange"
        />
      </div>
      <div className="lower-grid">
        <section className="panel">
          <h2>Practice accuracy over time</h2>
          <p className="subtle">
            Different skills and task lengths are not directly comparable.
          </p>
          {plot.length ? (
            <div className="chart">
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={plot}>
                  <CartesianGrid strokeDasharray="3 5" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} unit="%" />
                  <Tooltip />
                  <Area
                    dataKey="accuracy"
                    stroke="#1659fc"
                    fill="#1659fc22"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <Empty
              icon={ChartNoAxesCombined}
              title="Your story is still beginning"
            >
              Complete a diagnostic or practice activity to start your progress
              chart.
            </Empty>
          )}
        </section>
        <section className="panel">
          <h2>Where to focus next</h2>
          {Object.keys(mistakes).length ? (
            <div className="focus-list">
              {Object.entries(mistakes)
                .sort((a, b) => b[1] - a[1])
                .map(([label, count]) => (
                  <div key={label}>
                    <div className="row between">
                      <strong>{label}</strong>
                      <span>{count} errors recorded</span>
                    </div>
                    <div className="progress">
                      <i
                        style={{
                          width: `${Math.min(100, (count / Math.max(...Object.values(mistakes))) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <Empty icon={Target} title="Let your results guide you">
              Your recurring error types will appear after submitted practice.
            </Empty>
          )}
        </section>
      </div>
      <section className="panel">
        <h2>Skill-by-skill evidence</h2>
        <div className="criteria-grid">
          {["Listening", "Reading", "Grammar", "Vocabulary"].map((skill) => {
            const a = attempts.filter((a: Data) => a.skill === skill);
            return (
              <div key={skill}>
                <h3>{skill}</h3>
                <strong className="large-number">
                  {a.length ? `${a[0].result.accuracy}%` : "—"}
                </strong>
                <p>
                  {a.length
                    ? `${a.length} practices · latest accuracy`
                    : "No completed assessment"}
                </p>
              </div>
            );
          })}
        </div>
        <p className="subtle">
          Writing: {data.writing.filter((w: Data) => w.submitted_at).length}{" "}
          submitted responses. Speaking: {data.recordings.length} recordings for
          self-review. Neither receives an invented band estimate.
        </p>
      </section>
      <section className="panel">
        <h2>Assessment history</h2>
        {attempts.length ? (
          <ResultTable attempts={attempts} onReview={onReview} />
        ) : (
          <Empty icon={NotebookPen} title="A clean page">
            Your submitted practice history will be saved here.
          </Empty>
        )}
      </section>
    </>
  );
}

export function Mistakes({ data, act, onPractise }: Data) {
  const [filter, setFilter] = useState("All");
  const items = data.mistakes.filter(
    (m: Data) =>
      filter === "All" ||
      (filter === "Due today" &&
        m.due <= new Date().toISOString() &&
        m.status !== "Mastered") ||
      m.status === filter,
  );
  return (
    <>
      <PageHeading
        eyebrow="YOUR MISTAKE NOTEBOOK"
        title="Every mistake is a useful clue."
        description="Understand it, try again, and give your learning time to stick."
      />
      <div className="mistake-filters">
        {[
          "All",
          "Due today",
          "Not understood",
          "Learning",
          "Understood",
          "Mastered",
        ].map((f) => (
          <button
            key={f}
            className={f === filter ? "active" : ""}
            onClick={() => setFilter(f)}
          >
            {f}
            {f === "All" && <span>{data.mistakes.length}</span>}
          </button>
        ))}
      </div>
      {items.length ? (
        <div className="mistake-list">
          {items.map((m: Data) => (
            <section className="panel mistake-card" key={m.id}>
              <div className="row between">
                <Tag color="orange">{m.category}</Tag>
                <span className="subtle">
                  {m.repetitions > 1
                    ? `Repeated ${m.repetitions} times`
                    : "First recorded"}{" "}
                  · {dateLabel(m.created_at)}
                </span>
              </div>
              <h3>{m.question}</h3>
              <div className="answer-comparison">
                <span>
                  Your answer: <b>{m.answer || "Not answered"}</b>
                </span>
                <span className="green-text">
                  Correct answer: <b>{m.correction}</b>
                </span>
              </div>
              <p>{m.explanation}</p>
              <div className="row between mistake-bottom">
                <label>
                  My understanding
                  <select
                    value={m.status}
                    onChange={(e) =>
                      void act({
                        action: "mistake",
                        id: m.id,
                        status: e.target.value,
                      }).catch(() => {})
                    }
                  >
                    {[
                      "Not understood",
                      "Learning",
                      "Understood",
                      "Mastered",
                    ].map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </label>
                <span className="subtle">Next review: {dateLabel(m.due)}</span>
                <button
                  className="outline"
                  onClick={() => onPractise(m.activity_id)}
                >
                  <RotateCcw size={15} />
                  Practise again
                </button>
              </div>
            </section>
          ))}
        </div>
      ) : (
        <section className="panel">
          <Empty
            icon={NotebookPen}
            title={
              filter === "All"
                ? "Nothing to review just yet."
                : "Your review queue is clear."
            }
          >
            {filter === "All"
              ? "When you submit a practice activity, missed answers and their explanations will be collected here."
              : "Choose another filter or return when your next review is due."}
          </Empty>
        </section>
      )}
    </>
  );
}
