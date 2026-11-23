"use client";
import { useState } from "react";
import {
  ChevronLeft,
  CheckCircle2,
  BookOpen,
  Compass,
  Lightbulb,
  Play,
  Clock,
  NotebookPen,
} from "lucide-react";
import type { Data } from "./ui";
import { PageHeading, Tag, skillColors } from "./ui";
import { PhaseButtons, strategyRequest } from "./strategy-workspace";
import { StrategyVisual } from "./strategy-visual";
export function StrategyLesson({
  lesson: l,
  catalog,
  data,
  onBack,
  onPractice,
  onStudio,
  onError,
  refresh,
}: Data) {
  const [stage, setStage] = useState(0),
    [note, setNote] = useState(""),
    [busy, setBusy] = useState(false);
  const p = catalog.patterns.find((p: Data) => p.strategyId === l.strategyId),
    s = catalog.strategies.find((s: Data) => s.id === l.strategyId),
    saved = data.strategy.lessonProgress.filter((r: Data) => r.day === l.day),
    steps = [
      "Learn",
      "Decode",
      "Demonstrate",
      "Practise",
      "Challenge",
      "Review",
    ];
  async function save(stageName: string) {
    setBusy(true);
    try {
      await strategyRequest({
        action: "lesson",
        day: l.day,
        stage: stageName,
        body: note,
      });
      await refresh();
      setNote("");
      if (stageName === "complete") onBack();
      else setStage(Math.min(5, stage + 1));
    } catch (e) {
      onError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <button className="text-button back-link" onClick={onBack}>
        <ChevronLeft size={16} />
        Back to your course
      </button>
      <PageHeading
        eyebrow={`STRATEGY COURSE · DAY ${l.day}`}
        title={l.title}
        description="Understand why the method works, use it on fresh questions, then review the evidence."
      />
      <div className="lesson-v2-layout">
        <aside className="lesson-journey panel">
          <span className="eyebrow">YOUR LESSON JOURNEY</span>
          {steps.map((name, i) => (
            <button
              key={name}
              className={stage === i ? "active" : ""}
              onClick={() => {
                setStage(i);
                setNote("");
              }}
            >
              <span>
                {saved.some((r: Data) => r.stage === name.toLowerCase()) ? (
                  <CheckCircle2 size={17} />
                ) : (
                  i + 1
                )}
              </span>
              {name}
            </button>
          ))}
          <p className="subtle">
            Split the lesson across sessions. Notes, results and timed attempts
            are saved.
          </p>
          {data.days.some((d: Data) => d.day === l.day) && (
            <div className="callout">
              A V1 completion is preserved for this day. V2 strategy progress is
              tracked separately.
            </div>
          )}
        </aside>
        <section className="panel lesson-v2-content">
          <Tag color={skillColors[l.skill]}>{l.skill} · Intermediate</Tag>
          <h2>
            {
              [
                "Understand the question",
                "Decode the trap",
                "Watch the reasoning",
                "Apply it, then work independently",
                "Test the method against the clock",
                "Review, repair and reflect",
              ][stage]
            }
          </h2>
          <p>
            <b>Today’s objective:</b> {s.explanation}
          </p>
          {l.patterns.length > 0 && (
            <div className="callout">
              <strong>Additional question types today</strong>
              <p>
                {l.patterns
                  .map(
                    (id: string) =>
                      catalog.patterns.find((p: Data) => p.id === id)?.name,
                  )
                  .join(" · ")}
              </p>
              <p>
                These full reference lessons and examples are in Question
                Decoder. Where dedicated practice is pending, the core path
                below uses the available {p.name} bank.
              </p>
            </div>
          )}
          {stage === 0 ? (
            <>
              <h3>{p.name}</h3>
              <p>{p.purpose}</p>
              <p>{p.assesses}</p>
              <div className="worked-example">
                <span>
                  <BookOpen size={16} />
                  WHAT YOU WILL SEE
                </span>
                <p>{p.appearance}</p>
              </div>
              <p className="subtle">{p.advice}</p>
              {l.day === 1 && (
                <div className="callout">
                  <h3>Your initial diagnostic</h3>
                  <p>
                    Complete all four objective diagnostic activities from Daily
                    Practice, then submit a writing sample and save a speaking
                    recording. The results are learning indicators, not an
                    official band.
                  </p>
                  <button
                    className="outline"
                    onClick={() => onStudio("Grammar", 1)}
                  >
                    Start the grammar diagnostic
                  </button>
                </div>
              )}
            </>
          ) : stage === 1 ? (
            <>
              <h3>Where the answer comes from</h3>
              <p>{p.locate}</p>
              <h3>A tempting wrong turn</h3>
              <p>{p.trap}</p>
              <h3>Common beginner assumption</h3>
              <p>{p.beginner}</p>
              <ol>
                {p.steps.map((v: string) => (
                  <li key={v}>{v}</li>
                ))}
              </ol>
            </>
          ) : stage === 2 ? (
            <>
              {p.examples.map((e: Data, i: number) => (
                <div className="worked-example" key={i}>
                  <span>
                    <Lightbulb size={16} />
                    EXAMPLE {i + 1}
                  </span>
                  {e.audio && <audio controls src={e.audio} />}{" "}
                  {e.visual && <StrategyVisual visual={e.visual} />}
                  <p>{e.source}</p>
                  <h3>{e.question}</h3>
                  <ol>
                    {e.steps.map((t: string) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ol>
                  <strong>{e.answer}</strong>
                </div>
              ))}
            </>
          ) : stage === 3 ? (
            <>
              <p>
                Guided practice has optional hints. Independent practice uses
                ten different questions without hints. Both save your responses.
              </p>
              <PhaseButtons
                strategyId={l.strategyId}
                data={data}
                onPractice={(id: string, phase: string) =>
                  onPractice(id, phase, undefined, l.day)
                }
              />
            </>
          ) : stage === 4 ? (
            <>
              <div className="callout">
                <Clock size={19} />
                <h3>Five questions. Five minutes.</h3>
                <p>
                  No hints or answer evidence appear before submission. If you
                  leave or reload, the deadline is still enforced.
                </p>
              </div>
              <p>{p.timing}</p>
              <button
                className="primary"
                onClick={() =>
                  onPractice(l.strategyId, "timed", undefined, l.day)
                }
              >
                <Clock size={16} />
                Start or resume timed challenge
              </button>
              {l.pending && (
                <p className="callout warning">
                  The full-length assessment required for this syllabus day is
                  still pending from V1. This short challenge does not replace
                  it and will not complete the day.
                </p>
              )}
            </>
          ) : (
            <>
              <h3>Your strategy evidence</h3>
              <div className="lesson-results">
                {data.strategy.attempts
                  .filter((a: Data) => a.day === l.day && a.submitted_at)
                  .map((a: Data) => (
                    <div key={a.id}>
                      <span>
                        {a.strategy_id} · {a.phase}
                      </span>
                      <b>
                        {a.result.correct}/{a.result.total} ·{" "}
                        {a.result.accuracy}%
                      </b>
                    </div>
                  ))}
              </div>
              <h3>Repair one reasoning error</h3>
              <p>
                Write the evidence you missed and create a correct example.
                Review the answer explanations before retrying.
              </p>
              <div className="lesson-support-grid">
                <button
                  className="outline"
                  onClick={() => onPractice("G01", "guided", undefined, l.day)}
                >
                  Grammar accuracy · 5 questions
                </button>
                <button
                  className="outline"
                  onClick={() => onPractice("V01", "guided", undefined, l.day)}
                >
                  Vocabulary meaning · 5 questions
                </button>
                <button
                  className="outline"
                  onClick={() =>
                    onStudio(
                      l.skill === "Reading" ? "Listening" : "Reading",
                      l.day,
                    )
                  }
                >
                  Secondary skill practice
                </button>
                <button
                  className="outline"
                  onClick={() =>
                    onStudio(
                      l.skill === "Speaking" ? "Speaking" : "Writing",
                      l.day,
                    )
                  }
                >
                  Write or record your own response
                </button>
              </div>
              <p className="subtle">
                The daily foundation work, secondary skill and an original
                written or recorded response complement the primary strategy
                path.
              </p>
            </>
          )}
          {[0, 1, 2, 5].includes(stage) && (
            <div className="lesson-note">
              <label>
                {stage === 5
                  ? "Your revision note or final reflection"
                  : "Explain this step in your own words"}
                <textarea
                  rows={4}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={
                    stage === 5
                      ? "The evidence I missed was… My revised approach is…"
                      : "This strategy works because…"
                  }
                />
              </label>
              {saved.find(
                (r: Data) => r.stage === steps[stage].toLowerCase(),
              ) && (
                <blockquote>
                  {
                    saved.find(
                      (r: Data) => r.stage === steps[stage].toLowerCase(),
                    ).body
                  }
                </blockquote>
              )}
              <div className="row lesson-actions">
                {stage === 5 ? (
                  <>
                    <button
                      className="outline"
                      disabled={busy}
                      onClick={() => void save("review")}
                    >
                      Save mistake analysis
                    </button>
                    <button
                      className="outline"
                      disabled={busy}
                      onClick={() => void save("revision")}
                    >
                      Save corrective exercise
                    </button>
                    <button
                      className="primary"
                      disabled={busy}
                      onClick={() => void save("complete")}
                    >
                      <CheckCircle2 size={16} />
                      Complete day
                    </button>
                  </>
                ) : (
                  <button
                    className="primary"
                    disabled={busy}
                    onClick={() => void save(steps[stage].toLowerCase())}
                  >
                    {busy ? "Saving…" : "Save note & continue"}
                  </button>
                )}
              </div>
              <p className="subtle">
                Viewing a lesson never grants mastery. Completing a day requires
                the submitted work and a reflection.
              </p>
            </div>
          )}
          {[3, 4].includes(stage) && (
            <button className="text-button" onClick={() => setStage(stage + 1)}>
              Continue the lesson path
            </button>
          )}
        </section>
        <aside className="panel strategy-day-schedule">
          <h3>Your 180-minute plan</h3>
          {l.schedule.map(([title, minutes]: [string, number]) => (
            <div key={title}>
              <span>{title}</span>
              <b>{minutes} min</b>
            </div>
          ))}
          <hr />
          <p>
            {l.pending
              ? "Assessment schedule shown for planning. Required full content is pending; use available practice without claiming a full result."
              : "Recommended study allocation, not recorded study time. Take breaks and return to saved work."}
          </p>
          <h3>Vocabulary to collect</h3>
          <p>
            Note a useful word or paraphrase from the examples in your revision
            note. Your foundation flashcards remain in Grammar & Vocabulary.
          </p>
        </aside>
      </div>
    </>
  );
}
