"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import {
  BookOpen,
  Lightbulb,
  Play,
  CheckCircle2,
  Clock,
  Compass,
  Search,
  ChevronLeft,
  Target,
  Sparkles,
  TriangleAlert,
  Save,
  Mic,
  PenLine,
} from "lucide-react";
import type { Data } from "./ui";
import { PageHeading, Tag, Empty, request, clock, skillColors } from "./ui";
import { StrategyVisual } from "./strategy-visual";
import { AIReviewPanel } from "./ai-review";
export async function strategyRequest(body: unknown) {
  return request("/api/strategy", body);
}
export function EvidencePanel({
  attemptId,
  questionId,
  legacy = false,
  onPractice,
  onError,
}: Data) {
  const [tab, setTab] = useState("Why?"),
    [details, setDetails] = useState<Data | null>(null),
    [busy, setBusy] = useState(false);
  async function show(name: string) {
    setTab(name);
    if (details) return;
    setBusy(true);
    try {
      setDetails(
        await request(
          `/api/strategy?explain=1&attempt=${encodeURIComponent(attemptId)}&question=${encodeURIComponent(questionId)}&legacy=${legacy ? "1" : "0"}`,
        ),
      );
    } catch (e) {
      onError?.((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="evidence-explorer">
      <div className="explanation-actions">
        {[
          "Why?",
          "Evidence",
          "The trap",
          "Reliable method",
          "Burmese",
          "Similar practice",
        ].map((t) => (
          <button
            className={details && t === tab ? "active" : ""}
            key={t}
            onClick={() => void show(t)}
          >
            {t === "Why?"
              ? "Why is my answer wrong?"
              : t === "Burmese"
                ? "Explain in Burmese"
                : t}
          </button>
        ))}
      </div>
      {busy && <p>Loading your answer reasoning…</p>}
      {details && (
        <div className="explanation-body">
          {tab === "Why?" ? (
            <>
              <div className="answer-comparison">
                <span>
                  Your answer: <b>{details.studentAnswer || "Not answered"}</b>
                </span>
                <span>
                  Supported answer: <b>{details.correctAnswer}</b>
                </span>
              </div>
              <ol>
                {details.reasoning.map((s: string, i: number) => (
                  <li key={i}>{s}</li>
                ))}
              </ol>
              {Object.keys(details.wrongOptions || {}).length > 0 && (
                <details>
                  <summary>Why the other options fail</summary>
                  {Object.entries(details.wrongOptions).map(([option, why]) => (
                    <p key={option}>
                      <b>{option}:</b> {String(why)}
                    </p>
                  ))}
                </details>
              )}
            </>
          ) : tab === "Evidence" ? (
            <blockquote>
              <mark>{details.evidence}</mark>
            </blockquote>
          ) : tab === "The trap" ? (
            <>
              <h4>Check the assumption</h4>
              <p>{details.trap}</p>
              <p className="subtle">
                This describes a possible reasoning error; we cannot know your
                thought process from a selected answer alone.
              </p>
            </>
          ) : tab === "Reliable method" ? (
            <>
              <h4>{details.strategy?.name}</h4>
              <p>{details.strategy?.explanation}</p>
              <ol>
                {details.strategy?.steps.map((s: string) => (
                  <li key={s}>{s}</li>
                ))}
              </ol>
              <p className="subtle">{details.strategy?.limits}</p>
            </>
          ) : tab === "Burmese" ? (
            <>
              <p lang="my">{details.burmese}</p>
              <p className="subtle">
                A short reviewed Burmese study reminder. Detailed
                question-specific Burmese explanations require the AI tutor.
              </p>
            </>
          ) : (
            <>
              <p>
                Practise the same reasoning on another question. The source
                attempt stays unchanged.
              </p>
              <button
                className="primary"
                disabled={!details.followUp || !onPractice}
                onClick={() => onPractice(details.strategy.id, "independent")}
              >
                Open related independent practice
              </button>
            </>
          )}
        </div>
      )}
      <AIReviewPanel
        kind={legacy ? "legacy" : "strategy"}
        sourceId={attemptId}
        questionId={questionId}
        onError={onError}
      />
    </div>
  );
}
function WorkedExamples({ pattern }: Data) {
  return (
    <div className="worked-examples">
      {pattern.examples.map((e: Data, i: number) => (
        <article className="worked-example" key={i}>
          <span>
            <Lightbulb size={16} />
            WORKED EXAMPLE {i + 1}
          </span>
          {e.visual && <StrategyVisual visual={e.visual} />}{" "}
          {e.audio && <audio controls preload="none" src={e.audio} />}
          <p className="example-source">{e.source}</p>
          <h3>{e.question}</h3>
          <ol>
            {e.steps.map((s: string, j: number) => (
              <li key={j}>{s}</li>
            ))}
          </ol>
          <p>
            <strong>Supported response:</strong> {e.answer}
          </p>
        </article>
      ))}
    </div>
  );
}
export function QuestionDecoder({ catalog, data, onPractice, onStudio }: Data) {
  const [skill, setSkill] = useState("All"),
    [search, setSearch] = useState(""),
    [selected, setSelected] = useState<string | null>(null),
    [section, setSection] = useState("Understand");
  const pattern = catalog.patterns.find((p: Data) => p.id === selected);
  if (pattern)
    return (
      <>
        <button
          className="text-button back-link"
          onClick={() => setSelected(null)}
        >
          <ChevronLeft size={16} />
          All question patterns
        </button>
        <PageHeading
          eyebrow={`QUESTION DECODER · ${pattern.skill.toUpperCase()}`}
          title={pattern.name}
          description={pattern.purpose}
        />
        <div className="tabs decoder-tabs">
          {["Understand", "Decode", "Worked examples", "Practise"].map((s) => (
            <button
              key={s}
              className={s === section ? "active" : ""}
              onClick={() => setSection(s)}
            >
              {s}
            </button>
          ))}
        </div>
        {section === "Worked examples" ? (
          <WorkedExamples pattern={pattern} />
        ) : section === "Practise" ? (
          <section className="panel">
            <h2>Build understanding, then practise independently.</h2>
            {pattern.practiceAvailable ? (
              <PhaseButtons
                strategyId={pattern.strategyId}
                data={data}
                onPractice={onPractice}
              />
            ) : (
              <div className="callout">
                This pattern has a full reference lesson and worked examples.
                Its dedicated exercise bank is pending; it is not counted as a
                mastered practice type.
              </div>
            )}
            {["Writing", "Speaking"].includes(pattern.skill) && (
              <button
                className="outline"
                onClick={() => onStudio(pattern.skill)}
              >
                Open real {pattern.skill.toLowerCase()} practice
              </button>
            )}
            <p className="subtle">
              Strategy-choice exercises measure reasoning about a task.
              Productive skill assessment needs your own writing or recorded
              speech.
            </p>
          </section>
        ) : (
          <section className="panel decoder-detail">
            <Tag color={section === "Decode" ? "orange" : "blue"}>
              {section === "Decode"
                ? "HOW THE QUESTION WORKS"
                : "MEET THE QUESTION TYPE"}
            </Tag>
            {(section === "Decode"
              ? [
                  ["How to locate or construct the answer", pattern.locate],
                  ["Typical trap", pattern.trap],
                  ["Frequent beginner mistake", pattern.beginner],
                  ["Time-management technique", pattern.timing],
                  ["Band 6.5 preparation advice", pattern.advice],
                ]
              : [
                  ["What it assesses", pattern.assesses],
                  ["What it usually looks like", pattern.appearance],
                  ["Common wording", pattern.wording],
                  ["Why this method works", pattern.locate],
                ]
            ).map(([title, text]) => (
              <div className="decoder-section" key={title}>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
            <h3>A reliable solving sequence</h3>
            <ol>
              {pattern.steps.map((s: string) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
            <button
              className="primary"
              onClick={() =>
                setSection(
                  section === "Understand" ? "Decode" : "Worked examples",
                )
              }
            >
              {section === "Understand"
                ? "Decode the pattern"
                : "See two worked examples"}
            </button>
          </section>
        )}
      </>
    );
  return (
    <>
      <PageHeading
        eyebrow="IELTS QUESTION DECODER"
        title="Know what the question is asking."
        description="Understand the task, recognise misleading details, and learn why a method works."
      />
      <div className="coverage-strip">
        <span>
          <b>{catalog.coverage.referenceTypes}</b> reference lessons
        </span>
        <span>
          <b>{catalog.coverage.activeStrategies}</b> complete practice paths
        </span>
        <span>
          <b>{catalog.coverage.practiceQuestions}</b> original strategy
          questions
        </span>
      </div>
      <div className="practice-toolbar">
        <div className="search-box">
          <Search size={18} />
          <input
            aria-label="Search question patterns"
            placeholder="Search a question type…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          aria-label="Filter patterns by skill"
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
      <div className="decoder-grid">
        {catalog.patterns
          .filter(
            (p: Data) =>
              (skill === "All" || p.skill === skill) &&
              `${p.name} ${p.skill}`
                .toLowerCase()
                .includes(search.toLowerCase()),
          )
          .map((p: Data) => (
            <button
              className="lesson-card"
              key={p.id}
              onClick={() => {
                setSelected(p.id);
                setSection("Understand");
                window.scrollTo({ top: 0 });
              }}
            >
              <Tag color={skillColors[p.skill]}>{p.skill}</Tag>
              <h3>{p.name}</h3>
              <p>{p.purpose}</p>
              <span className="pattern-status">
                {p.practiceAvailable
                  ? "Learn · Guided · Independent · Timed"
                  : "Reference + worked examples · Practice pending"}
              </span>
            </button>
          ))}
      </div>
    </>
  );
}
export function PhaseButtons({ strategyId, data, onPractice }: Data) {
  return (
    <div className="phase-grid">
      {[
        ["guided", "Apply with guidance", "5 questions · Optional hints"],
        [
          "independent",
          "Try it independently",
          "10 fresh questions · No hints",
        ],
        [
          "timed",
          "Take the timed challenge",
          "5 new questions · 5-minute limit",
        ],
      ].map(([phase, title, detail]) => {
        const a = data.strategy.attempts.find(
            (a: Data) =>
              a.strategy_id === strategyId &&
              a.phase === phase &&
              !a.submitted_at,
          ),
          done = data.strategy.attempts.filter(
            (a: Data) =>
              a.strategy_id === strategyId &&
              a.phase === phase &&
              a.submitted_at,
          );
        return (
          <div key={phase}>
            <Tag color={phase === "timed" ? "orange" : "blue"}>{phase}</Tag>
            <h3>{title}</h3>
            <p>{detail}</p>
            {done.length > 0 && (
              <span className="subtle">
                Latest: {done[0].result.accuracy}% · {done.length} completed
              </span>
            )}
            <button
              className="primary"
              onClick={() => onPractice(strategyId, phase)}
            >
              {a ? "Resume" : done.length ? "Practise again" : "Start"}{" "}
              {phase === "timed" ? <Clock size={15} /> : <Play size={15} />}
            </button>
          </div>
        );
      })}
    </div>
  );
}
export function StrategyPlaybook({
  catalog,
  data,
  onPractice,
  onError,
  refresh,
  onStudio,
}: Data) {
  const [category, setCategory] = useState("All"),
    [selected, setSelected] = useState<string | null>(null),
    [note, setNote] = useState(""),
    [micro, setMicro] = useState<Data | null>(null),
    [busy, setBusy] = useState(false);
  const s = catalog.strategies.find((s: Data) => s.id === selected),
    p = catalog.patterns.find((p: Data) => p.strategyId === selected);
  useEffect(() => {
    setNote(
      data.strategy.progress.find((p: Data) => p.strategy_id === selected)
        ?.note || "",
    );
  }, [selected]);
  async function generate() {
    setBusy(true);
    try {
      await strategyRequest({ action: "micro" });
      await refresh();
    } catch (e) {
      onError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (micro)
    return (
      <>
        <button
          className="text-button back-link"
          onClick={() => setMicro(null)}
        >
          <ChevronLeft size={16} />
          Back to playbook
        </button>
        <PageHeading
          eyebrow="YOUR FOCUSED 10-MINUTE LESSON"
          title={micro.title}
          description={micro.reason}
        />
        <section className="panel">
          <h2>One idea to practise</h2>
          <p>{micro.lesson.explanation}</p>
          <WorkedExamples pattern={{ examples: micro.lesson.examples }} />
          <p>
            Three practice questions followed by two short mastery-check
            questions. Results stay separate from full IELTS scores.
          </p>
          <button
            className="primary"
            onClick={() => onPractice(micro.strategy_id, "micro", micro.id)}
          >
            Start targeted micro-lesson
          </button>
        </section>
      </>
    );
  if (s && p)
    return (
      <>
        <button
          className="text-button back-link"
          onClick={() => setSelected(null)}
        >
          <ChevronLeft size={16} />
          All strategies
        </button>
        <PageHeading
          eyebrow={`BAND 6.5 STRATEGY PLAYBOOK · ${s.id}`}
          title={s.name}
          description={s.explanation}
        />
        <section className="panel">
          <Tag>LEVEL 1 · UNDERSTAND</Tag>
          <h2 className="strategy-title">When to use it</h2>
          <p>{s.when}</p>
          <h3>When it may fail</h3>
          <p>{s.limits}</p>
          <WorkedExamples pattern={p} />
          <label>
            Explain the strategy in your own words
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="The evidence I should check is…"
            />
          </label>
          <button
            className="outline"
            onClick={async () => {
              try {
                await strategyRequest({
                  action: "understand",
                  strategyId: s.id,
                  note,
                });
                await refresh();
              } catch (e) {
                onError((e as Error).message);
              }
            }}
          >
            <CheckCircle2 size={16} />
            Save understanding note
          </button>
          <p className="subtle">
            Understanding is a learning milestone. Mastery requires independent
            and timed evidence.
          </p>
        </section>
        {s.practiceAvailable ? (
          <section className="panel">
            <Tag>LEVELS 2 & 3 · APPLY AND MASTER</Tag>
            <PhaseButtons
              strategyId={s.id}
              data={data}
              onPractice={onPractice}
            />
            <p className="subtle">
              Mastery needs at least 10 distinct independent answers and 5
              distinct timed answers, with at least 80% accuracy in each. Repeat
              answers alone do not add evidence.
            </p>
          </section>
        ) : (
          <section className="panel">
            <p>Dedicated practice for this reference strategy is pending.</p>
            {["Writing", "Speaking"].includes(s.skill) && (
              <button className="primary" onClick={() => onStudio(s.skill)}>
                Open {s.skill.toLowerCase()} studio
              </button>
            )}
          </section>
        )}
      </>
    );
  return (
    <>
      <PageHeading
        eyebrow="BAND 6.5 STRATEGY PLAYBOOK"
        title="A better approach, one strategy at a time."
        description="These are defensible study techniques—not shortcuts that guarantee a score."
      />
      <div className="practice-toolbar">
        <Tag color="neutral">Mastery comes from performance</Tag>
        <select
          aria-label="Strategy category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {[
            "All",
            ...new Set<string>(catalog.strategies.map((s: Data) => s.category)),
            "Examination Time Management",
            "Common Mistakes",
            "Score Planning",
          ].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>
      {["All", "Examination Time Management", "Common Mistakes"].includes(
        category,
      ) && (
        <div className="strategy-notes">
          {catalog.notes.map((n: Data) => (
            <details className="panel" key={n.id}>
              <summary>
                {n.id} · {n.name}
              </summary>
              <p>{n.text}</p>
            </details>
          ))}
        </div>
      )}
      {category === "Score Planning" && (
        <section className="panel">
          <h2>Plan the whole score</h2>
          <p>
            Use Score Planner in the sidebar to test a four-skill scenario and
            check minimum section requirements. Entered values remain planning
            inputs, never invented assessment results.
          </p>
        </section>
      )}
      <div className="decoder-grid">
        {catalog.strategies
          .filter((s: Data) => category === "All" || s.category === category)
          .map((s: Data) => {
            const a = data.strategy.analytics.find(
              (a: Data) => a.strategyId === s.id,
            );
            return (
              <section className="panel strategy-card" key={s.id}>
                <div className="row between">
                  <Tag color={skillColors[s.skill]}>{s.skill}</Tag>
                  <span className="subtle">Intermediate · {s.minutes} min</span>
                </div>
                <h3>{s.name}</h3>
                <p>{s.explanation}</p>
                <div className="strategy-card-tags">
                  {s.tags.map((t: string) => (
                    <span key={t}>{t}</span>
                  ))}
                </div>
                <div className="strategy-evidence">
                  <span>{a?.total || 0} questions answered</span>
                  <b>
                    {a?.accuracy === null || !a
                      ? "Not assessed"
                      : `${a.accuracy}%`}
                  </b>
                </div>
                <p className="subtle">
                  {a?.mastery || "Not assessed"}
                  {!s.practiceAvailable ? " · Practice bank pending" : ""}
                </p>
                <button
                  className="outline full"
                  onClick={() => {
                    setSelected(s.id);
                    window.scrollTo({ top: 0 });
                  }}
                >
                  Learn this strategy
                </button>
              </section>
            );
          })}
      </div>
      <section className="panel micro-queue">
        <div className="section-heading">
          <div>
            <h2>Turn real mistakes into short lessons.</h2>
            <p>
              Repeated errors guide your review queue. No errors are invented.
            </p>
          </div>
          <button
            className="primary"
            disabled={busy}
            onClick={() => void generate()}
          >
            <Sparkles size={16} />
            {busy ? "Selecting…" : "Build a micro-lesson"}
          </button>
        </div>
        {data.strategy.micros.length ? (
          <div className="micro-list">
            {data.strategy.micros.map((m: Data) => (
              <button
                key={m.id}
                onClick={async () => {
                  try {
                    setMicro(await request(`/api/strategy?micro=${m.id}`));
                  } catch (e) {
                    onError((e as Error).message);
                  }
                }}
              >
                <span>
                  <b>{m.title}</b>
                  <small>{m.reason}</small>
                </span>
                <Clock size={17} />
                10 min
              </button>
            ))}
          </div>
        ) : (
          <Empty icon={Lightbulb} title="Your mistakes will point the way">
            After submitted practice, generate a focused lesson with two
            examples, three questions and a two-question check.
          </Empty>
        )}
        <p className="subtle">
          30 focused lesson blueprints are available. Up to three per strategy
          are selected from your evidence to avoid flooding your queue.
        </p>
      </section>
    </>
  );
}
export function StrategyPractice({
  initial,
  onClose,
  onError,
  onPractice,
  refresh,
}: Data) {
  const [attempt, setAttempt] = useState(initial),
    [answers, setAnswers] = useState<Record<string, string>>(initial.answers),
    [timings, setTimings] = useState<Record<string, number>>(initial.timings),
    [index, setIndex] = useState(0),
    [hint, setHint] = useState(false),
    [busy, setBusy] = useState(false),
    [status, setStatus] = useState("Saved"),
    [remaining, setRemaining] = useState(
      initial.deadline
        ? Math.max(
            0,
            Math.ceil((Date.parse(initial.deadline) - Date.now()) / 1000),
          )
        : 0,
    );
  const current = useRef({ answers, timings }),
    chain = useRef<Promise<any>>(Promise.resolve()),
    closed = useRef(!!initial.submitted_at),
    autoTriggered = useRef(false);
  current.current = { answers, timings };
  const q = attempt.questions[index];
  const save = useCallback(() => {
    const values = { ...current.current };
    setStatus("Saving…");
    chain.current = chain.current
      .catch(() => {})
      .then(async () => {
        const result = await strategyRequest({
          action: "save",
          id: initial.id,
          ...values,
        });
        setStatus("Saved");
        if (result.submitted_at) {
          closed.current = true;
          setAttempt(result);
        }
        return result;
      });
    return chain.current;
  }, [initial.id]);
  useEffect(() => {
    if (attempt.submitted_at) return;
    const t = setInterval(() => {
      if (document.visibilityState === "visible")
        setTimings((v) => ({ ...v, [q.id]: (v[q.id] || 0) + 1 }));
      if (initial.deadline)
        setRemaining(
          Math.max(
            0,
            Math.ceil((Date.parse(initial.deadline) - Date.now()) / 1000),
          ),
        );
    }, 1000);
    return () => clearInterval(t);
  }, [q.id, attempt.submitted_at, initial.deadline]);
  useEffect(() => {
    if (attempt.submitted_at) return;
    const t = setTimeout(
      () =>
        void save().catch(() => setStatus("Not saved · retry when connected")),
      600,
    );
    return () => clearTimeout(t);
  }, [answers, attempt.submitted_at, save]);
  useEffect(() => {
    if (attempt.submitted_at) return;
    const t = setInterval(
      () =>
        void save().catch(() => setStatus("Not saved · retry when connected")),
      8000,
    );
    const warn = (e: BeforeUnloadEvent) => {
      if (!closed.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => {
      clearInterval(t);
      window.removeEventListener("beforeunload", warn);
    };
  }, [attempt.submitted_at, save]);
  async function submit() {
    if (busy || closed.current) return;
    setBusy(true);
    try {
      await save();
      const result = await strategyRequest({
        action: "submit",
        id: initial.id,
      });
      closed.current = true;
      setAttempt(result);
      await refresh();
    } catch (e) {
      onError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    if (
      initial.deadline &&
      remaining === 0 &&
      !closed.current &&
      !busy &&
      !autoTriggered.current
    ) {
      autoTriggered.current = true;
      void submit();
    }
  }, [remaining, busy]);
  if (attempt.result)
    return (
      <>
        <PageHeading
          eyebrow={
            attempt.kind === "trap"
              ? "SPOT THE TRAP · REVIEW"
              : "STRATEGY PRACTICE · REVIEW"
          }
          title="Look at the reasoning, not just the score."
          description={attempt.result.label}
        />
        <div className="result-banner">
          <span className="result-score">
            {attempt.result.correct}
            <small>/{attempt.result.total}</small>
          </span>
          <div>
            <h2>{attempt.result.accuracy}% answer accuracy</h2>
            {attempt.kind === "trap" && (
              <p>
                <b>{attempt.result.trapAccuracy}% trap recognition</b> ·
                Recorded separately from normal exam accuracy
              </p>
            )}
            <p>
              {attempt.result.answered}/{attempt.result.total} answered · Saved
              for revision
            </p>
          </div>
          <button className="outline" onClick={onClose}>
            Return to your lesson
          </button>
        </div>
        {attempt.phase === "micro" && (
          <div className="panel">
            <h2>Short mastery check</h2>
            <p>
              {
                attempt.result.review.filter(
                  (q: Data) => q.microStage === "Mastery check" && q.correct,
                ).length
              }
              /2 check questions correct. This small check informs revision; it
              cannot establish strategy mastery alone.
            </p>
          </div>
        )}
        {attempt.result.review.map((r: Data, i: number) => (
          <section className="panel" key={r.id}>
            <div className="row between">
              <Tag color={r.correct ? "green" : "orange"}>
                Question {i + 1} · {r.correct ? "Correct" : "Review"}
              </Tag>
              <span className="subtle">
                {r.seconds === null
                  ? "Timing not measured"
                  : `${r.seconds} seconds`}
              </span>
            </div>
            <h3 className="strategy-title">{r.text || r.question}</h3>
            {r.audio && <audio controls src={r.audio} />}
            <blockquote>{r.source}</blockquote>
            {r.visual && <StrategyVisual visual={r.visual} />}
            <div className="answer-comparison">
              <span>
                Your answer: <b>{r.student || "Not answered"}</b>
              </span>
              <span>
                Supported answer: <b>{r.answer}</b>
              </span>
            </div>
            {attempt.kind === "trap" && (
              <p>
                Trap selected: {r.studentTrap || "Not answered"} ·{" "}
                {r.trapCorrect ? "Recognised" : "Review the mechanism"}
                <br />
                {r.mechanism}
              </p>
            )}
            <EvidencePanel
              attemptId={attempt.id}
              questionId={r.id}
              onPractice={onPractice}
              onError={onError}
            />
          </section>
        ))}
        <section className="panel">
          <h2>Make the next step specific.</h2>
          <button
            className="primary"
            onClick={async () => {
              try {
                await strategyRequest({
                  action: "micro",
                  sourceAttempt: attempt.id,
                });
                await refresh();
                onClose();
              } catch (e) {
                onError((e as Error).message);
              }
            }}
          >
            <Sparkles size={16} />
            Turn my mistakes into practice
          </button>
        </section>
      </>
    );
  return (
    <>
      <div className="exam-toolbar">
        <div>
          <Tag color={attempt.deadline ? "orange" : "blue"}>
            {attempt.kind === "trap"
              ? "SPOT THE TRAP"
              : attempt.phase.toUpperCase()}
          </Tag>
          <h1>{attempt.title}</h1>
          <p className="subtle">
            Question {index + 1} of {attempt.questions.length} · {status}
          </p>
        </div>
        {attempt.deadline ? (
          <div className="exam-timer">
            <Clock size={20} />
            <strong>{clock(remaining)}</strong>
            <span>remaining · no hints</span>
          </div>
        ) : (
          <button
            className="outline"
            onClick={async () => {
              try {
                await save();
                await refresh();
                onClose();
              } catch (e) {
                onError((e as Error).message);
              }
            }}
          >
            <Save size={16} />
            Save & leave
          </button>
        )}
      </div>
      <div className="question-navigator">
        {attempt.questions.map((v: Data, i: number) => (
          <button
            className={`${answers[v.id] ? "answered" : ""} ${index === i ? "current" : ""}`}
            key={v.id}
            aria-label={`Question ${i + 1}`}
            onClick={() => {
              setIndex(i);
              setHint(false);
            }}
          >
            {i + 1}
          </button>
        ))}
      </div>
      <div
        className={`strategy-practice-grid ${q.audio ? "listening-three" : ""}`}
      >
        <section className="panel strategy-question">
          <Tag color={skillColors[q.skill]}>
            {q.skill}
            {q.microStage ? ` · ${q.microStage}` : ""}
          </Tag>
          <h2>{q.text || q.question}</h2>
          {q.source && <blockquote>{q.source}</blockquote>}
          {q.visual && <StrategyVisual visual={q.visual} />}
          <fieldset className="question">
            <legend>Your answer</legend>
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
                    onChange={() => setAnswers({ ...answers, [q.id]: option })}
                  />
                  {option}
                </label>
              ))}
            </div>
          </fieldset>
          {attempt.kind === "trap" && (
            <fieldset className="question">
              <legend>Which trap should you avoid?</legend>
              <div className="options">
                {q.trapOptions.map((option: string) => (
                  <label
                    key={option}
                    className={
                      answers[`${q.id}:trap`] === option ? "chosen" : ""
                    }
                  >
                    <input
                      type="radio"
                      name={`${q.id}:trap`}
                      checked={answers[`${q.id}:trap`] === option}
                      onChange={() =>
                        setAnswers({ ...answers, [`${q.id}:trap`]: option })
                      }
                    />
                    {option}
                  </label>
                ))}
              </div>
            </fieldset>
          )}
        </section>
        {q.audio && (
          <section className="panel strategy-audio">
            <h3>Listen for the final meaning.</h3>
            <audio
              key={q.audio}
              controls
              preload="metadata"
              src={q.audio}
              onError={() =>
                onError(
                  "Audio could not be loaded. Check the connection before answering.",
                )
              }
            />
            <p>
              Original synthetic-voice material. Transcript unlocks after
              submission.
            </p>
          </section>
        )}
        {attempt.phase === "guided" && (
          <aside className="panel strategy-hint">
            <Lightbulb size={25} />
            <h3>Use the method.</h3>
            <p>Think first. A hint is here if you need a prompt.</p>
            <button className="outline" onClick={() => setHint(!hint)}>
              {hint ? "Hide hint" : "Show a guided hint"}
            </button>
            {hint && <div className="callout">{q.hint}</div>}
          </aside>
        )}
      </div>
      <div className="strategy-practice-controls">
        <button
          className="outline"
          disabled={index === 0}
          onClick={() => {
            setIndex(index - 1);
            setHint(false);
          }}
        >
          Previous
        </button>
        <span>
          {
            Object.keys(answers).filter(
              (k) => !k.endsWith(":trap") && answers[k],
            ).length
          }
          /{attempt.questions.length} answered
        </span>
        {index < attempt.questions.length - 1 ? (
          <button
            className="primary"
            onClick={() => {
              setIndex(index + 1);
              setHint(false);
            }}
          >
            Next question
          </button>
        ) : (
          <button
            className="primary"
            disabled={busy}
            onClick={() => void submit()}
          >
            {busy ? "Submitting…" : "Submit & review"}
          </button>
        )}
      </div>
      <p className="subtle">
        Unanswered items remain incomplete and receive no mark. Only the timed
        challenge enforces a deadline.
      </p>
    </>
  );
}
