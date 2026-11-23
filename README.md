# IELTS Sprint 30

**Vercel deployment:** Follow [VERCEL-DEPLOY.md](VERCEL-DEPLOY.md). Vercel requires a connected Turso database for durable sessions and saved progress. A local SQLite file or `/tmp` cannot provide this.

**V2 strategy upgrade:** See [V2-UPGRADE.md](V2-UPGRADE.md) for the new decoder, playbook, guided/timed strategy engine, trap trainer, adaptive micro-lessons, score planning, revised course, data-preservation notes and remaining content scope. The baseline V1 documentation below is retained for context.

A working first release of a single-learner IELTS Academic study application. Built with Next.js App Router, TypeScript, React, Lucide icons, Recharts, and durable SQLite storage. This implements the vertical-slice option in the brief. **It is not the complete content library or a production SaaS release.**

## Run locally

Requires Node.js 24 (uses the built-in `node:sqlite` module) and npm. On Windows, use `npm.cmd` if PowerShell blocks the npm script shim.

```powershell
cd 'D:\IELTS Practice\ielts-sprint-30'
npm.cmd install
npm.cmd run dev
```

Open <http://127.0.0.1:3000>. Production build: `npm.cmd run build`, then `npm.cmd start`.

Sign in with user name **TTH** and password **9834**. Optional server-side `LOGIN_USERNAME` and `LOGIN_PASSWORD` values in `.env.local` override these defaults. Sessions last seven days; use **Settings ? Sign out** to revoke the current session. On your first sign-in, use your existing browser to keep its saved study history. Subsequent sign-ins use the same personal account across browsers. No database service or paid AI subscription is needed for the learning activities. Use **Settings** to choose your name, target, dates, and daily study time. The initial target is 6.5 and the start date uses Asia/Rangoon.

## First learning journey

1. Select **Start Day 1** and read the lesson and worked example.
2. Start the grammar diagnostic; answer the 20 questions and submit.
3. Review correct answers and explanations. Missed answers appear in **Mistake Notebook**. Return to the dashboard to see actual results.
4. Complete vocabulary, reading, listening, writing, and a speaking recording from the corresponding labs. Day 1 is complete only after all six components and a written reflection.
5. Any course day is accessible. For subsequent days, submit the assigned activity and a reflection. An incomplete objective submission is scored and retained, but does not earn XP or complete a lesson.

Practice can be saved and resumed. Strict reading checkpoints have a server-recorded deadline, continuously saved answers, and automatic submission while open. If a tab is closed when the deadline passes, the next server access finalises the saved attempt. Late answers are rejected.

## Included content and working features

| Area        | This release                                                                                                                                                                             |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Course      | 30 distinct short lessons, objectives, examples, assignments, reflections, completion rules and calendar navigation                                                                      |
| Grammar     | 20 original multiple-choice diagnostic questions with explanations                                                                                                                       |
| Vocabulary  | 20 contextual diagnostic questions and 20 flashcards with definitions, examples, collocations, pronunciation through browser speech synthesis where supported, and scheduled reviews     |
| Reading     | One original ~500-word passage, ten True/False/Not Given questions, evidence excerpts, split view, adjustable font, session-local highlighting, flags and navigator                      |
| Listening   | One original workshop recording, ten aligned short-answer questions, playback and post-submission transcript                                                                             |
| Writing     | One actual bar-chart Task 1 stimulus and two Task 2 prompts, word count, optional practice countdown, autosaved drafts, submission checks, self-review criteria and optional AI feedback |
| Speaking    | Two interview topics with Parts 1–3, question read-aloud, Part 2 preparation timer, recording limit, microphone recording, private upload/playback and manual transcript/notes           |
| Mock centre | One strict 20-minute reading checkpoint; three full-mock cards explicitly marked pending                                                                                                 |
| Analytics   | Saved objective accuracy, history, active practice time, errors by type and date filters; no invented bands                                                                              |
| Mistakes    | Automatic collection, repeated-error counts, review statuses, next review dates and retry links                                                                                          |
| Tutor       | Optional server-side contextual AI chat; offline state explains configuration                                                                                                            |
| Settings    | Persisted profile, dates, preferences, dark/light theme, microphone check, JSON history export and personal-data deletion                                                                |

The scheduled days currently reuse the available practice banks; they do **not** contain 30 independent sets. Course days requiring full mocks (21, 27 and 29) cannot be marked complete until those assessments are implemented. Daily time allocations describe a recommended plan, not fabricated completed study time. The time counters currently measure active objective practice; time spent reading lessons or drafting essays is not counted. Speaking recordings are retained separately.

## Audio

`public/audio/workshop.wav` is an actual ~79-second PCM WAV generated from the original script in `lib/content.ts` with Microsoft Zira Desktop. It is synthetic speech, not a human examiner recording or a controlled accent mix. It works without live text-to-speech access. `scripts/generate-audio.ps1` reproduces it on Windows with the matching installed voice. The transcript and questions are aligned with this script.

Speaking requires a browser supporting MediaRecorder and a microphone, on localhost or HTTPS. If permission is denied, the app gives an actionable error. Browser-level microphone behavior was **not manually verified** in this build session. Automatic transcription, pause analysis, audio assessment and pronunciation scoring are pending. Saving a recording does not claim that it has been assessed.

## Optional AI

OpenRouter is supported for answer analysis, Writing feedback, typed Speaking-transcript feedback and the tutor. Set the following in the private `.env.local` file, then restart the app:

```dotenv
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=your-private-key
OPENROUTER_MODEL=openai/gpt-4.1-mini
```

The model ID is configurable. The adapter uses OpenRouter’s [documented Chat Completions endpoint](https://openrouter.ai/docs/api/reference/overview), with the key on the server. Never use `NEXT_PUBLIC_` variables or enter the key into chat. The private file is ignored by Git. Settings shows “Configured” when a key exists; the first real request checks whether that key and model can be used. Requests can incur provider charges.

For the previous direct OpenAI integration, choose `AI_PROVIDER=openai` with `OPENAI_API_KEY` and optionally `OPENAI_MODEL`. If no provider is explicitly selected, an OpenRouter key takes precedence, then the legacy OpenAI key. No silent switch occurs when an explicit provider is missing its key.

After submitting an objective activity, use **Analyse my answer with AI** in its review. The server loads the owned, submitted response and its verified source rather than trusting client-supplied answer keys. Feedback is saved separately and never changes deterministic scores. Speaking-journal items with typed transcripts/notes offer text feedback; audio, pronunciation and measured fluency are not analysed.

Requested reviews send the relevant answer, passage/transcript and limited learning context to the configured provider. For OpenRouter this involves OpenRouter and the selected upstream model provider. Audio files and API keys are not sent to the browser. Saved reviews are private to the learner session and are removed with personal-data deletion. AI Tutor replies use Markdown, with formatted headings, lists, emphasis, tables and code blocks. Raw HTML is disabled; responses are never executed or promoted to the verified question bank. Band estimates remain unofficial and uncertain. Model request shapes, provider errors, ownership, saved feedback and score preservation are tested with mocks; a live provider request still requires your own valid key.

## Persistence and architecture

### Tutor chats and memory

The AI Tutor includes **New chat**, a searchable chat-history sidebar, editable titles, saved drafts and per-chat pinned context. Each chat has its own model conversation; unrelated chat messages are not sent together. Existing tutor messages are preserved in a **Previous conversation** chat. Global study indicators remain available across chats.

Open **Chat memory** to choose a 2k, 4k or 8k estimated conversation budget. Pinned notes and the current question use part of that budget; the remaining space keeps the most recent complete turns, up to 24 turns. Older messages remain in saved history. This is an approximate application memory budget, not the selected model’s official context limit. System instructions, study context and the generated reply use additional tokens. There is no automatic AI summary of omitted messages.

Chat titles, messages, drafts, pinned notes and window settings persist in SQLite. Only the selected-chat ID is kept as a device preference. New chats, history and settings work without an AI key; generating replies uses the existing provider configuration. Failed requests retain a draft rather than inventing a reply. Concurrent requests in a single chat are serialized, and a reloaded chat can recover an in-progress reply. Personal-data deletion also removes its chats and messages.

Migration 008 adds chat storage without deleting earlier messages. A pre-upgrade backup is retained at `data/backups/pre-tutor-chats-2026-11-24.sqlite`. The tests cover migration preservation, isolation, context trimming, provider payload history, drafts, ownership and opening/switching/starting chats with mounted React components.

`lib/content.ts` is the version-controlled question bank. The browser receives questions without answer keys, explanations, evidence or listening transcripts until submission. Attempts retain a complete question snapshot so historical reviews survive future question changes. `lib/scoring.ts` handles answer normalization, configurable approximate 40-question conversion thresholds, weighted Writing and overall rounding. No short practice score is extrapolated into a band. Overall bands require all four components; Grammar and Vocabulary never become independent IELTS bands.

`lib/service.ts` owns study rules and scoring transactions. `lib/db.ts` uses WAL, foreign keys, prepared statements and ordered SQL migrations in `db/migrations`. Migrations are applied automatically at startup and recorded in `schema_migrations`. The first release has users, profiles, attempts with answer snapshots, study days, mistakes, vocabulary reviews, writing drafts, tutor messages and recordings. This is a scoped equivalent of the larger proposed schema, not all 30 proposed entities.

`data/sprint.sqlite` contains persistent records. `data/recordings/` contains private uploads. Login session tokens are stored as hashes in SQLite. The legacy signed session key, retained for first-login history migration, is `data/session.key`. All are ignored by Git. Back up **the entire data directory** with the app stopped, or use SQLite’s backup API. Set `DATA_DIR` to an absolute persistent directory when deploying. Losing the session key invalidates existing browser sessions. Clearing browser cookies loses access to that browser’s profile; there is no cross-device sign-in/recovery yet. JSON history export does not include audio bytes; download audio from the player’s controls.

Recordings are served only after checking their owning session. State responses are private/no-store, writes check origin, SQL values are parameterized, and AI calls have per-session request limits. The application binds to loopback by default. This is suitable for personal local use; before any internet-facing release, replace the basic shared login with individual accounts and recovery, strengthen operational rate limits, backup/retention policies, TLS, secure cookies and PostgreSQL/object storage or equivalent managed storage. Set `SECURE_COOKIES=true` behind HTTPS.

## Verification

```powershell
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
# With the dev server running, exercise the real HTTP API:
$env:TEST_INTEGRATION='1'
npm.cmd test
```

The workflow tests sign in to the configured personal account on an isolated test server, checks profile save/reload, response resume, deterministic marking, idempotent submission, repeated errors, complete/incomplete lesson rules, draft validation, autosave/submission races, spaced repetition, strict deadlines, late-answer rejection, audio upload/playback ownership, isolation, origin protection and data deletion. It deliberately expires only its own checkpoint using the local database; use the same DATA_DIR for test and server. Do not point this test at a public deployment.

Build, type checking, seven unit/content tests, and the API workflow test passed. Browser preview permission was declined, so visual browser QA, keyboard behavior, responsive rendering and live microphone interaction remain unverified. CSS includes desktop, tablet, mobile and reduced-motion layouts; that implementation is not a substitute for real device testing.

## Remaining scope

- Three complete original full-length mock banks, five additional listening and reading sets, the remaining writing/speaking prompts, and the full 100-question grammar and vocabulary banks.
- More question types, genuinely independent daily banks, map/process stimuli and longer natural multi-speaker audio.
- Full strict section sequencing, strict Listening playback and a timed Speaking interview.
- Automated transcription and evidence-based audio assessment.
- A comprehensive diagnostic report, adaptive exercise generation, weekly AI reports, badges, vocabulary extraction from selections and cross-device authentication.
- Immutable writing submission versions (current writing drafts/submissions use one saved response per prompt), full writing/speaking time tracking, and comprehensive production hardening.
- Public hosting. Sites’ Worker/D1 runtime does not directly run this Next.js/Node SQLite build. A D1/R2/Worker adapter or a Node host with a persistent volume is required. No broken static export or non-persistent hosted copy has been published.

## IELTS references and integrity

Test structure and scoring were checked against the official [Academic test format](https://ielts.org/take-a-test/test-types/ielts-academic-test), [scoring explanation](https://ielts.org/take-a-test/your-results/ielts-scoring-in-detail), and [sample question guidance](https://ielts.org/take-a-test/preparation-resources/sample-test-questions/academic-test). All included practice content is original. The conversion table is an approximate configurable learning aid because raw-score thresholds can vary by form. Overall rounding follows the nearest half-band convention. Writing Task 2 has twice the weight of Task 1.

This app is independent of IELTS and offers unofficial practice, not endorsed assessments or a guaranteed Band 6.5 outcome.
