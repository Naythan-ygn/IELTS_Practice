# V2 strategy engine — implemented scope and verification

This is an additive upgrade to the existing Next.js application. The original navigation, visual system, signed sessions, practice engine, recordings, tutor, settings, and historical results remain available. This release implements the strategy learning engine; **the entire requested V2 content expansion is not yet complete**.

## What is available

| Feature                     | Implemented behavior                                                                                                                                                                                                                                                                                                             |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Question Decoder            | All 40 requested Listening, Reading, Writing and Speaking reference types, plus two Grammar/Vocabulary foundations. Each has purpose, assessed skill, format, answer location, wording, traps, beginner errors, method, timing advice and two worked examples.                                                                   |
| Dedicated strategy practice | Ten complete paths: L02 corrections, L03 spoken paraphrases, R01 evidence/TFNG, R03 paragraph purpose, R05 elimination, W01 overviews, W02 essay task analysis, S01 response development, G01 grammar and V01 paraphrasing. Each has five guided, ten different independent and five further timed questions: 200 new questions. |
| Listening assets            | 62 playable, original synthetic-voice WAV clips: 22 worked examples and 40 exercise clips. Traps reuse the aligned clips. No transcript is returned with an unsubmitted listening exercise.                                                                                                                                      |
| Strategy Playbook           | Understand / Apply / Master levels, saved understanding notes, tags, actual attempts and accuracy. Additional notes cover prediction, sequencing, recovery, word limits, synonym mapping, scanning and pacing.                                                                                                                   |
| Spot the Trap               | 24 scenarios across four skills. Learners identify the trap and answer the question. Trap-recognition accuracy is separate from normal question-type accuracy.                                                                                                                                                                   |
| Explain My Answer           | Post-submission comparison, real evidence, reasoning, incorrect-choice rationale, traps, strategy, short Burmese reminder and related practice. Available on original practice reviews and V2 reviews.                                                                                                                           |
| Thirty-day course           | The revised syllabus, a progressive Learn → Decode → Demonstrate → Practise → Challenge → Review journey, saved notes and reflections, daily schedules totalling 180 minutes, foundation work, secondary practice and original writing/recording requirements.                                                                   |
| Adaptive micro-lessons      | 30 focused blueprints. Actual mistakes select a ten-minute lesson with an explanation, two examples, three practice questions and two check questions. Repeated errors increase priority; the queue is capped at three lessons per strategy.                                                                                     |
| Analytics                   | Actual question-type counts, correct responses, accuracy, recent accuracy, approximate focus time, sample-size cautions, recurring errors, revision recommendations and a heatmap.                                                                                                                                               |
| Score planning              | Four equally weighted inputs, half-band rounding, optional minimum section requirements, optional approximate raw-score conversions, saved scenarios and explicit planning labels. Scenarios never become assessment results.                                                                                                    |
| Writing coach               | Seven modes: planning, introduction, thesis, paragraph development, grammar correction, timed essay pacing and rewriting. Original, revision and rationale are saved separately. Offline review is a criterion checklist, not an invented evaluation. Existing optional AI can provide specific feedback.                        |
| Speaking                    | Existing real microphone recording, preparation timer, private playback and manual transcript remain available. The decoder teaches Parts 1–3 and links to the studio. No pronunciation estimate is inferred from text.                                                                                                          |
| Post-test strategy report   | Submitted original checkpoints and practice show type performance, errors, unanswered items, timing limitations, review priorities and “Turn my mistakes into practice”. The source attempt is unchanged.                                                                                                                        |

Writing and Speaking multiple-choice exercises test **strategy knowledge**, not the learner’s actual productive performance. W02 includes analysis of several essay instructions; S01 includes development techniques for all three speaking parts. Their question-type tags follow the context of each item. Counts in the handbook are not claims about official test frequency.

## Preserving existing data

A consistent SQLite backup and hashes were created before migration:

`data/backups/pre-v2-2026-11-23.sqlite`

`data/backups/pre-v2-manifest.json`

Migrations 003–006 only add tables or columns. They do not delete or rewrite original attempts, answer snapshots, profiles, lessons, recordings or results. `course_progress_v2` is independent of V1 `study_days`; old day completion is not automatically converted into strategy mastery. New strategy mistakes join the notebook with distinct activity identifiers. The original study history is retained and exported with the new state.

To apply migrations without launching the app, run:

```powershell
node --experimental-strip-types scripts/migrate-v2.ts
node scripts/backup-v2.mjs --verify
```

The hash check is appropriate immediately after the upgrade. Later legitimate learner activity can change records; do not use the snapshot to overwrite newer study data.

## Mastery and timing rules

- Viewing an explanation or saving a note never grants mastery.
- Strategy mastery requires ten distinct independent questions and five distinct timed questions, at least 80% correct in each group. First exposure is used; repeat attempts or prior micro-lesson exposure do not inflate fresh evidence.
- Strategy mastery describes the demonstrated reasoning method, not an official IELTS question-type or component band.
- A micro-lesson’s two-question check is a local revision signal, not full mastery.
- Timed challenges allow one minute per question, with a server-side deadline. This is a training budget, not an official per-question rule. Late saves are rejected and the next server access finalises an expired closed-tab attempt.
- Timed practice exposes no hints; coaching endpoints reject assistance while an active timed assessment is running.
- New per-question times measure visible focus on a question, capped by real elapsed time. They approximate attention, not exact cognitive response time. Historical questions without measurements show no invented timing.
- Strategy questions, trap recognition, user-entered scenarios and actual exam-style results remain distinct.

## Content limits still visible in the product

The other reference types have explanations and worked examples, but do not yet have their own five-guided/ten-independent banks. The decoder explicitly marks these dedicated banks pending. Several course days therefore combine the requested reference topic with the available transferable core strategy path; the interface explains the substitution.

The original application did not contain complete full-length mock sets. Its working 20-minute reading checkpoint is preserved. Three complete mocks, a 60-minute/40-question Reading section, a 40-question Listening section and strict full-section sequencing remain pending. Days 21, 25, 26, 27 and 29 cannot be completed using a shortened substitute.

The 30 micro-lessons are authored blueprints selected from actual mistakes, not unlimited AI-generated new content. They reuse relevant bank questions and identify the source strategy; they are not counted as 150 additional unseen questions. All audio uses the same installed synthetic voice; there is no claimed natural multi-speaker accent coverage.

Live transcription, measured speaking hesitation, audio-based pronunciation assessment, full criterion scoring without an AI connection, and the remaining Task 1/Task 2 prompt banks are not added by this upgrade. Full Writing/Speaking bands are not fabricated from strategy-choice accuracy. The Writing Coach’s local pacing timer is not a strict exam timer.

## Run and verify

Use the existing setup in README. No paid service is required for deterministic strategy practice.

```powershell
cd 'D:\IELTS Practice\ielts-sprint-30'
npm.cmd install
npm.cmd run dev
```

```powershell
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
```

For production HTTP workflow checks, run the production server against **isolated test data**, leaving real learner data untouched:

```powershell
$env:DATA_DIR='D:\IELTS Practice\ielts-sprint-30\.test-data\http-v2'
npm.cmd start -- --port 3001
```

In a second PowerShell terminal:

```powershell
$env:DATA_DIR='D:\IELTS Practice\ielts-sprint-30\.test-data\http-v2'
$env:TEST_BASE_URL='http://127.0.0.1:3001'
$env:TEST_INTEGRATION='1'
npm.cmd test
```

The suite covers content integrity, real WAV files, visual-source consistency, component server rendering, answer secrecy, ownership, resume, idempotent scoring, timed expiry, mistake generation, micro-lessons, separate trap accuracy, completion gates, score requirements, immutable source results and the original learning workflow. Unit service tests use separate generated SQLite directories. Browser interaction, mobile rendering and live microphone behavior have not been visually verified; the earlier browser-preview refusal was respected. Server rendering is not presented as browser QA.

Verified in this upgrade: **26 tests passed, none skipped**, including both HTTP workflows against the production server with isolated data. TypeScript checking and the optimized production build passed. After migrations, hashes of all rows in the nine original user-data tables still matched the pre-V2 snapshot. Concurrent API tests also verified the SQLite write-wait handling.

The current exercise pool is finite. If earlier exposure or unsuccessful first attempts leave insufficient fresh evidence, repeat practice can improve understanding but cannot manufacture a mastery result; additional unseen questions will be needed.

## Educational integrity

Official test structure and published scoring conventions were checked against the [IELTS Academic format](https://ielts.org/take-a-test/test-types/ielts-academic-test), [scoring explanation](https://ielts.org/take-a-test/your-results/ielts-scoring-in-detail), and [Academic sample question guidance](https://ielts.org/take-a-test/preparation-resources/sample-test-questions/academic-test).

The 15/20/25 Reading split, four-paragraph Task 1 plan, answer-expansion frameworks, one-minute-per-question challenges and the 80% mastery threshold are **training heuristics**, not official rules. Band conversions are approximate and configurable; forms can differ. AI feedback is unofficial and uncertain. No strategy, phrase, template or accent guarantees a band score. All practice is independent and unaffiliated with IELTS.
