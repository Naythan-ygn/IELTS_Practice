"use client";
import {
  Check,
  Download,
  Mic,
  ShieldCheck,
  Trash2,
  LogOut,
} from "lucide-react";
import { useState } from "react";
import type { Data } from "./ui";
import { PageHeading, Tag } from "./ui";
export function SettingsPage({ data, act, onError, onNotice }: Data) {
  const [p, setP] = useState({ ...data.profile }),
    [busy, setBusy] = useState(false),
    [deleting, setDeleting] = useState(false),
    [confirm, setConfirm] = useState("");
  const input = (key: string, value: any) => setP({ ...p, [key]: value });
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await act({ action: "profile", profile: { ...p, onboarded: true } });
      onNotice("Your study preferences are saved.");
    } catch {
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageHeading
        eyebrow="MAKE THIS SPACE YOURS"
        title="Your goal. Your way."
        description="Keep your study plan aligned with your life."
      />
      <form onSubmit={save} className="settings-layout">
        <section className="panel">
          <h2>Your study profile</h2>
          <p className="subtle">
            Your progress is saved in your private study account.
          </p>
          <button
            type="button"
            className="btn secondary"
            onClick={async () => {
              try {
                const res = await fetch("/api/auth/logout", { method: "POST" });
                if (!res.ok)
                  throw Error("Unable to sign out. Please try again.");
                window.location.assign("/login");
              } catch (e) {
                onError((e as Error).message);
              }
            }}
          >
            <LogOut size={15} /> Sign out
            {data.account?.username ? ` (${data.account.username})` : ""}
          </button>
          <div className="form-grid">
            <label>
              Display name
              <input
                value={p.name}
                maxLength={60}
                onChange={(e) => input("name", e.target.value)}
                required
              />
            </label>
            <label>
              Target overall band
              <select
                value={p.target}
                onChange={(e) => input("target", Number(e.target.value))}
              >
                {[4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9].map((b) => (
                  <option key={b}>{b.toFixed(1)}</option>
                ))}
              </select>
            </label>
            <label>
              Preparation start date
              <input
                type="date"
                value={p.startDate}
                onChange={(e) => input("startDate", e.target.value)}
                required
              />
            </label>
            <label>
              Examination date
              <input
                type="date"
                value={p.examDate}
                onChange={(e) => input("examDate", e.target.value)}
                required
              />
            </label>
            <label>
              Daily study hours
              <input
                type="number"
                min="0.5"
                max="8"
                step="0.5"
                value={p.hours}
                onChange={(e) => input("hours", Number(e.target.value))}
                required
              />
            </label>
            <label>
              Preferred difficulty
              <select
                value={p.difficulty}
                onChange={(e) => input("difficulty", e.target.value)}
              >
                {["Foundation", "Intermediate", "Advanced"].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <label>
              Explanation language
              <select
                value={p.language}
                onChange={(e) => input("language", e.target.value)}
              >
                <option>English</option>
                <option>Burmese</option>
              </select>
            </label>
            <label>
              Appearance
              <select
                value={p.theme}
                onChange={(e) => input("theme", e.target.value)}
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </label>
          </div>
          <p className="subtle">
            The course keeps its core 30-day progression when dates change.
            Missed lessons stay available and are never automatically completed.
            The initial bank is intermediate; additional difficulty levels are
            pending.
          </p>
          <button className="primary" disabled={busy}>
            <Check size={16} />
            {busy ? "Saving…" : "Save preferences"}
          </button>
        </section>
        <div className="settings-side">
          <section className="panel">
            <h2>Learning preferences</h2>
            <label className="toggle-row">
              <span>
                <strong>Study reminders</strong>
                <small>Show reminders in the notification centre</small>
              </span>
              <input
                type="checkbox"
                checked={p.notifications}
                onChange={(e) => input("notifications", e.target.checked)}
              />
            </label>
            <label className="toggle-row">
              <span>
                <strong>Audio guidance</strong>
                <small>Save your preferred audio setting</small>
              </span>
              <input
                type="checkbox"
                checked={p.audio}
                onChange={(e) => input("audio", e.target.checked)}
              />
            </label>
            <button
              type="button"
              className="outline"
              onClick={async () => {
                try {
                  const stream = await navigator.mediaDevices.getUserMedia({
                    audio: true,
                  });
                  stream.getTracks().forEach((t) => t.stop());
                  onNotice("Microphone access is working.");
                } catch {
                  onError(
                    "Microphone access is unavailable. Check browser permissions and use localhost or HTTPS.",
                  );
                }
              }}
            >
              <Mic size={16} />
              Check microphone access
            </button>
          </section>
          <section className="panel">
            <h2>AI connection</h2>
            <Tag color={data.aiEnabled ? "green" : "neutral"}>
              {data.aiEnabled
                ? `Configured · ${data.ai?.provider || "AI"}`
                : "Not configured"}
            </Tag>
            <p>
              API credentials stay on the server. Set{" "}
              <code>AI_PROVIDER=openrouter</code>,{" "}
              <code>OPENROUTER_API_KEY</code> and optionally{" "}
              <code>OPENROUTER_MODEL</code> in <code>.env.local</code>, then
              restart.
            </p>
            <p className="subtle">
              {data.aiEnabled
                ? `Selected model: ${data.ai?.model}. A key is present; access is checked on your first request. `
                : ""}
              No key is requested or stored in your browser. Selected responses
              and learning context are sent to the configured AI provider only
              when you request feedback. Direct OpenAI access is also supported
              with AI_PROVIDER=openai.
            </p>
          </section>
        </div>
      </form>
      <section className="panel data-settings">
        <div>
          <h2>Your learning data</h2>
          <p>
            Export your study history as JSON, or delete the personal data for
            this study session. Recordings are stored privately on this server.
          </p>
        </div>
        <div className="row">
          <button
            className="outline"
            onClick={() => {
              const blob = new Blob([JSON.stringify(data, null, 2)], {
                  type: "application/json",
                }),
                url = URL.createObjectURL(blob),
                a = document.createElement("a");
              a.href = url;
              a.download = "ielts-sprint-study-history.json";
              a.click();
              URL.revokeObjectURL(url);
              onNotice(
                "Study history exported. Recordings can be downloaded from your speaking journal.",
              );
            }}
          >
            <Download size={16} />
            Export history
          </button>
          <button
            className="danger-outline"
            onClick={() => setDeleting(!deleting)}
          >
            <Trash2 size={16} />
            Delete my data
          </button>
        </div>
        {deleting && (
          <div className="delete-confirm">
            <p>
              This removes your saved profile, attempts, drafts, and recordings.
              Type DELETE to confirm.
            </p>
            <input
              aria-label="Type DELETE to confirm"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
            <button
              className="danger"
              disabled={confirm !== "DELETE"}
              onClick={async () => {
                try {
                  const r = await fetch("/api/state", { method: "DELETE" });
                  if (!r.ok)
                    throw Error("Could not delete data. Please retry.");
                  location.reload();
                } catch (e) {
                  onError((e as Error).message);
                }
              }}
            >
              Permanently delete my study data
            </button>
          </div>
        )}
      </section>
      <section className="panel info-panel">
        <ShieldCheck size={24} />
        <p>
          This is an independent, unofficial IELTS Academic preparation app. It
          does not guarantee any band score. A target is a direction; your
          readiness must be assessed using evidence across all four skills.
        </p>
      </section>
    </>
  );
}
