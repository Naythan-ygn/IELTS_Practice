"use client";
import {
  Check,
  CheckCircle2,
  ChevronLeft,
  Layers,
  Lightbulb,
  Play,
  Volume2,
} from "lucide-react";
import { useState } from "react";
import type { Data } from "./ui";
import { Empty, PageHeading, skillColors, Tag } from "./ui";
export function Lesson({ lesson: l, data, onBack, onStart, act }: Data) {
  const [reflection, setReflection] = useState(
      data.days.find((d: Data) => d.day === l.day)?.reflection || "",
    ),
    [busy, setBusy] = useState(false);
  return (
    <>
      <button className="text-button back-link" onClick={onBack}>
        <ChevronLeft size={16} />
        Back to your workspace
      </button>
      <PageHeading
        eyebrow={`YOUR COURSE · DAY ${l.day}`}
        title={l.title}
        description={`${l.skill} focus · 180-minute daily plan · Review at your own pace`}
      />
      <div className="lesson-layout">
        <section className="panel lesson-content">
          <Tag color={skillColors[l.skill]}>TODAY’S LESSON</Tag>
          <h2>{l.concept}</h2>
          <p>{l.lesson}</p>
          <div className="worked-example">
            <span>
              <Lightbulb size={17} />
              WORKED EXAMPLE
            </span>
            <p>{l.example}</p>
          </div>
          <h3>Try it yourself</h3>
          <p>{l.assignment}</p>
          <button className="primary" onClick={onStart}>
            <Play size={16} />
            Start assigned {l.skill.toLowerCase()} practice
          </button>
          {l.day === 1 && (
            <div className="diagnostic-components">
              <h3>Your baseline: all six components</h3>
              <p>
                About 60–90 minutes. Pause practice and return at any time.
                Writing and speaking use self-review unless AI is connected.
              </p>
              {[
                "Grammar: 20 questions",
                "Vocabulary: 20 questions",
                "Reading: 10 questions",
                "Listening: 10 questions + audio",
                "Writing: one short academic response",
                "Speaking: a guided recording",
              ].map((t) => (
                <div key={t}>
                  <Check size={15} />
                  {t}
                </div>
              ))}
              <p className="subtle">
                Open each skill from Daily Practice or the sidebar. The full
                diagnostic must be finished before Day 1 is marked complete.
              </p>
            </div>
          )}
          {[21, 27, 29].includes(l.day) && (
            <div className="callout warning">
              The required full mock is pending. You can practise the reading
              checkpoint, but this day remains incomplete until the full
              assessment is available.
            </div>
          )}
          <hr />
          <h3>Reflect before moving on</h3>
          <p>What did you learn? What will you do differently next time?</p>
          <textarea
            aria-label="Daily reflection"
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            rows={4}
            placeholder="Today I noticed… Next time I will…"
          />
          <button
            className="primary"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await act({ action: "completeDay", day: l.day, reflection });
                onBack();
              } catch {
              } finally {
                setBusy(false);
              }
            }}
          >
            <CheckCircle2 size={16} />
            {busy ? "Saving…" : "Save reflection & complete day"}
          </button>
          <p className="subtle">
            Completion requires submitted practice and a reflection of at least
            20 characters.
          </p>
        </section>
        <aside className="panel daily-plan">
          <h3>Your daily balance</h3>
          {[
            ["Listening", 35],
            ["Reading", 40],
            ["Writing", 45],
            ["Speaking", 30],
            ["Grammar & review", 30],
          ].map(([s, m]) => (
            <div className="row between" key={s}>
              <span>{s}</span>
              <strong>{m} min</strong>
            </div>
          ))}
          <hr />
          <div className="row between">
            <strong>Total focus time</strong>
            <strong>3 hours</strong>
          </div>
          <p>
            This release reuses the available diagnostic practice sets for
            foundation review. New daily banks and full mock schedules are
            pending.
          </p>
        </aside>
      </div>
    </>
  );
}

export function Vocabulary({ words, data, act }: Data) {
  const [index, setIndex] = useState(0),
    [revealed, setRevealed] = useState(false),
    [busy, setBusy] = useState(false);
  const due = words.filter((w: Data) => {
      const review = data.reviews.find((r: Data) => r.word_id === w.id);
      return !review || review.due <= new Date().toISOString();
    }),
    word = due[index % due.length];
  return (
    <section className="panel vocabulary-panel">
      <div className="section-heading">
        <div>
          <Tag color="teal">SPACED REPETITION</Tag>
          <h2>Make it part of your vocabulary.</h2>
          <p>
            {due.length} words ready for review · {data.reviews.length} words in
            your history
          </p>
        </div>
        <Layers size={28} />
      </div>
      {word ? (
        <div className="flashcard">
          <span className="eyebrow">
            ACADEMIC WORD {(index % due.length) + 1} OF {due.length}
          </span>
          <h3>
            {word.word}
            <button
              className="icon-button"
              aria-label={`Pronounce ${word.word}`}
              onClick={() => {
                if ("speechSynthesis" in window) {
                  window.speechSynthesis.cancel();
                  const utterance = new SpeechSynthesisUtterance(word.word);
                  utterance.lang = "en-GB";
                  window.speechSynthesis.speak(utterance);
                }
              }}
            >
              <Volume2 size={20} />
            </button>
          </h3>
          <i>{word.pos}</i>
          {revealed ? (
            <>
              <p>{word.definition}</p>
              <blockquote>{word.example}</blockquote>
              <p className="subtle">
                Collocation: <strong>{word.collocation}</strong>
              </p>
              <div className="row review-actions">
                {[
                  ["again", "Still learning"],
                  ["good", "I remembered"],
                  ["easy", "Easy for me"],
                ].map(([rating, label]) => (
                  <button
                    className={rating === "good" ? "primary" : "outline"}
                    disabled={busy}
                    key={rating}
                    onClick={async () => {
                      setBusy(true);
                      try {
                        await act({
                          action: "reviewWord",
                          word: word.id,
                          rating,
                        });
                        setRevealed(false);
                        setIndex(0);
                      } catch {
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <p>Can you explain it and use it in a sentence?</p>
              <button className="primary" onClick={() => setRevealed(true)}>
                Reveal meaning & example
              </button>
            </>
          )}
        </div>
      ) : (
        <Empty icon={CheckCircle2} title="Your vocabulary is up to date">
          Come back when your next review is due. Spacing your practice helps
          you remember.
        </Empty>
      )}
    </section>
  );
}
