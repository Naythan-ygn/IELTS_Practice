"use client";
import {
  Activity,
  BookOpen,
  CalendarDays,
  ChartNoAxesCombined,
  GraduationCap,
  Headphones,
  Layers,
  LayoutDashboard,
  Mic,
  NotebookPen,
  PenLine,
  Settings,
  ShieldCheck,
  Sparkles,
  ScanSearch,
  Compass,
  TriangleAlert,
  Calculator,
} from "lucide-react";
export type Data = Record<string, any>;
export type Content = {
  activities: Data[];
  course: Data[];
  words: Data[];
  writingPrompts: Data[];
  speakingSets: Data[];
  strategyCatalog: Data;
};
export const navigation = [
  ["Dashboard", LayoutDashboard],
  ["My 30-Day Course", CalendarDays],
  ["Daily Practice", Layers],
  ["Question Decoder", ScanSearch],
  ["Strategy Playbook", Compass],
  ["Spot the Trap", TriangleAlert],
  ["Score Planner", Calculator],
  ["Listening Lab", Headphones],
  ["Reading Lab", BookOpen],
  ["Writing Studio", PenLine],
  ["Speaking Studio", Mic],
  ["Grammar & Vocabulary", GraduationCap],
  ["Mock Test Centre", ShieldCheck],
  ["Performance Analytics", ChartNoAxesCombined],
  ["Mistake Notebook", NotebookPen],
  ["AI Tutor", Sparkles],
  ["Settings", Settings],
] as const;

export const skillIcons: Record<string, any> = {
  Listening: Headphones,
  Reading: BookOpen,
  Writing: PenLine,
  Speaking: Mic,
  Grammar: GraduationCap,
  Vocabulary: Layers,
};

export const skillColors: Record<string, string> = {
  Listening: "blue",
  Reading: "violet",
  Writing: "orange",
  Speaking: "teal",
  Grammar: "pink",
  Vocabulary: "green",
};

export async function request(url: string, body?: unknown) {
  const r = await fetch(url, {
    method: body ? "POST" : "GET",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const data = await r.json();
  if (r.status === 401 && typeof window !== "undefined")
    window.location.assign("/login");
  if (!r.ok)
    throw Error(data.error || "Something went wrong. Please try again.");
  return data;
}

export function dateLabel(s: string) {
  return new Date(s.length === 10 ? `${s}T12:00:00` : s).toLocaleDateString(
    "en-GB",
    { day: "numeric", month: "short" },
  );
}

export function countWords(s: string) {
  return s.trim().match(/\S+/g)?.length || 0;
}

export function clock(s: number) {
  return `${Math.floor(Math.max(0, s) / 60)
    .toString()
    .padStart(2, "0")}:${(Math.max(0, s) % 60).toString().padStart(2, "0")}`;
}

export function Empty({
  icon: Icon = Activity,
  title,
  children,
}: {
  icon?: any;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="empty">
      <div className="empty-icon">
        <Icon size={25} />
      </div>
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}

export function Tag({
  children,
  color = "blue",
}: {
  children: React.ReactNode;
  color?: string;
}) {
  return <span className={`tag ${color}`}>{children}</span>;
}

export function PageHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
    </div>
  );
}

export function Stat({ icon: Icon, label, value, detail, color }: Data) {
  return (
    <div className="stat-card">
      <span className={`stat-icon ${color}`}>
        <Icon size={19} />
      </span>
      <span className="stat-label">{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </div>
  );
}

export function ResultTable({ attempts, onReview }: Data) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Activity</th>
            <th>Date</th>
            <th>Accuracy</th>
            <th>Study time</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {attempts.map((a: Data) => (
            <tr key={a.id}>
              <td>
                <strong>{a.skill}</strong>
                <span className="table-sub">
                  {a.mode === "strict" ? "Timed checkpoint" : "Practice"}
                </span>
              </td>
              <td>{dateLabel(a.submitted_at)}</td>
              <td>
                {a.result.correct}/{a.result.total}{" "}
                <Tag color={a.result.accuracy >= 70 ? "green" : "orange"}>
                  {a.result.accuracy}%
                </Tag>
              </td>
              <td>{clock(a.active_seconds)}</td>
              <td>
                <button className="text-button" onClick={() => onReview(a)}>
                  Review
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
