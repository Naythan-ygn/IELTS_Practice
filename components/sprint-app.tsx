"use client";
import {
  AudioLines,
  Bell,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Flag,
  Flame,
  Lightbulb,
  Menu,
  Moon,
  Play,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Sun,
  Target,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Analytics, Mistakes } from "./insights";
import { Vocabulary } from "./learning";
import { StrategyLesson } from "./strategy-lesson";
import {
  QuestionDecoder,
  StrategyPlaybook,
  StrategyPractice,
  strategyRequest,
} from "./strategy-workspace";
import { StrategyDashboard, ScorePlanner } from "./strategy-insights";
import { PracticePlayer } from "./practice-player";
import { SettingsPage } from "./settings";
import { SpeakingStudio } from "./speaking-studio";
import { Tutor } from "./tutor";
import type { Content, Data } from "./ui";
import {
  Empty,
  navigation,
  PageHeading,
  request,
  ResultTable,
  skillColors,
  skillIcons,
  Stat,
  Tag,
} from "./ui";
import { WritingStudio } from "./writing-studio";

export default function SprintApp({ content }: { content: Content }) {
  const [data, setData] = useState<Data | null>(null),
    [page, setPage] = useState("Dashboard"),
    [active, setActive] = useState<Data | null>(null),
    [strategyActive, setStrategyActive] = useState<Data | null>(null),
    [day, setDay] = useState(1),
    [lesson, setLesson] = useState<number | null>(null),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [mobile, setMobile] = useState(false),
    [notifications, setNotifications] = useState(false),
    [search, setSearch] = useState(""),
    [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    const s = await request("/api/state");
    setData(s);
    document.documentElement.dataset.theme = s.profile.theme;
    return s;
  }, []);
  useEffect(() => {
    refresh()
      .then((s) => {
        const timed = s.strategy.attempts.find(
          (a: Data) => a.deadline && !a.submitted_at,
        );
        const legacy = s.attempts.find(
          (a: Data) => a.mode === "strict" && !a.submitted_at,
        );
        if (timed) setStrategyActive(timed);
        else if (legacy) setActive(legacy);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [refresh]);
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(""), 4000);
    return () => clearTimeout(t);
  }, [notice]);
  const act = useCallback(
    async (body: unknown) => {
      try {
        const result = await request("/api/action", body);
        await refresh();
        return result;
      } catch (e) {
        setError((e as Error).message);
        throw e;
      }
    },
    [refresh],
  );
  function navigate(p: string) {
    if (
      (active && !active.submitted_at && active.mode === "strict") ||
      (strategyActive?.deadline && !strategyActive.submitted_at)
    ) {
      setError("Submit the strict checkpoint before leaving the examination.");
      return;
    }
    setActive(null);
    setStrategyActive(null);
    setLesson(null);
    setPage(p);
    setMobile(false);
    window.scrollTo({ top: 0 });
  }
  async function start(id: string, selectedDay = day, mode = "practice") {
    try {
      const a = await act({
        action: "start",
        activity: id,
        day: selectedDay,
        mode,
      });
      setActive(a);
      setMobile(false);
      window.scrollTo({ top: 0 });
    } catch {}
  }
  async function startStrategy(
    strategyId: string,
    phase = "guided",
    microId?: string,
    selectedDay = day,
  ) {
    try {
      const a = await strategyRequest({
        action: "begin",
        strategyId,
        phase,
        microId,
        day: selectedDay,
      });
      setStrategyActive(a);
      setActive(null);
      setDay(selectedDay);
      setMobile(false);
      await refresh();
      window.scrollTo({ top: 0 });
    } catch (e) {
      setError((e as Error).message);
    }
  }
  function goSkill(skill: string, selectedDay = day) {
    setDay(selectedDay);
    if (skill === "Writing" || skill === "Speaking") {
      navigate(`${skill} Studio`);
      return;
    }
    const id =
      skill === "Reading"
        ? "reading-1"
        : skill === "Listening"
          ? "listening-1"
          : skill === "Vocabulary"
            ? "vocabulary-diagnostic"
            : "grammar-diagnostic";
    void start(id, selectedDay);
  }
  if (loading)
    return (
      <div className="loading">
        <span className="brand-symbol">
          <AudioLines />
        </span>
        <h2>
          IELTS Sprint<span>30</span>
        </h2>
        <p>Getting your study space ready…</p>
      </div>
    );
  if (!data)
    return (
      <div className="loading">
        <h2>We couldn’t load your study space.</h2>
        <p>{error}</p>
        <button className="primary" onClick={() => location.reload()}>
          Try again
        </button>
      </div>
    );
  const courseDays = data.strategy.lessonProgress.filter(
    (d: Data) => d.stage === "complete",
  );
  const p = data.profile,
    done = data.attempts.filter((a: Data) => a.submitted_at),
    currentDay = Math.min(
      30,
      Math.max(
        1,
        Math.floor(
          (Date.parse(data.serverDate) - Date.parse(p.startDate)) / 86400000,
        ) + 1,
      ),
    ),
    daysLeft = Math.max(
      0,
      Math.ceil(
        (Date.parse(p.examDate) - Date.parse(data.serverDate)) / 86400000,
      ),
    ),
    totalSeconds = data.attempts.reduce(
      (s: number, a: Data) => s + a.active_seconds,
      0,
    ),
    todayDone = done.filter(
      (a: Data) =>
        new Intl.DateTimeFormat("en-CA", {
          timeZone: "Asia/Rangoon",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(new Date(a.submitted_at)) === data.serverDate,
    ),
    todaySeconds = data.attempts
      .filter(
        (a: Data) =>
          new Intl.DateTimeFormat("en-CA", {
            timeZone: "Asia/Rangoon",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          }).format(new Date(a.started_at)) === data.serverDate,
      )
      .reduce((s: number, a: Data) => s + a.active_seconds, 0),
    completedSkills = new Set(
      todayDone
        .filter((a: Data) => a.result.answered === a.result.total)
        .map((a: Data) => a.skill),
    ),
    xp =
      done.filter((a: Data) => a.result.answered === a.result.total).length *
        25 +
      courseDays.length * 100;
  for (const w of data.writing)
    if (w.submitted_at?.slice(0, 10) === data.serverDate)
      completedSkills.add("Writing");
  for (const r of data.recordings)
    if (r.created_at.slice(0, 10) === data.serverDate && r.duration >= 20)
      completedSkills.add("Speaking");
  const activeDates = new Set(
    done.map((a: Data) =>
      new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Rangoon",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date(a.submitted_at)),
    ),
  );
  let streak = 0;
  for (let i = 0; i < 31; i++) {
    const d = new Date(`${data.serverDate}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() - i);
    if (activeDates.has(d.toISOString().slice(0, 10))) streak++;
    else if (i > 0 || streak > 0) break;
  }
  const recommendations =
    courseDays.some((d: Data) => d.day === 1) && done.length
      ? [...new Set<string>(done.map((a: Data) => a.skill))]
          .map((skill) => ({
            skill,
            accuracy: done.find((a: Data) => a.skill === skill).result.accuracy,
          }))
          .sort((a, b) => a.accuracy - b.accuracy)
      : [];
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(`${data.serverDate}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() - 6 + i);
    const date = d.toISOString().slice(0, 10);
    return {
      name: d.toLocaleDateString("en-GB", { weekday: "short" }),
      minutes: Math.round(
        data.attempts
          .filter((a: Data) => a.started_at.slice(0, 10) === date)
          .reduce((s: number, a: Data) => s + a.active_seconds, 0) / 60,
      ),
    };
  });
  const available = content.activities.filter(
    (a) =>
      !search ||
      `${a.title} ${a.skill} ${a.description}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  return (
    <div className="app">
      <aside className={`sidebar ${mobile ? "open" : ""}`}>
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            navigate("Dashboard");
          }}
        >
          <span className="brand-symbol">
            <AudioLines size={25} />
          </span>
          <span>
            IELTS Sprint<span className="brand-30">30</span>
            <small>YOUR GOAL. YOUR JOURNEY.</small>
          </span>
        </a>
        <div className="workspace-label">YOUR WORKSPACE</div>
        <nav aria-label="Main navigation">
          {navigation.map(([label, Icon], i) => (
            <button
              key={label}
              className={`nav-item ${page === label && !active && !strategyActive ? "selected" : ""} ${label === "Mock Test Centre" ? "nav-divider" : ""}`}
              onClick={() => navigate(label)}
            >
              <Icon size={19} />
              <span>{label}</span>
              {label === "AI Tutor" && <span className="new-label">AI</span>}
              {label === "Mistake Notebook" && data.mistakes.length > 0 && (
                <span className="nav-count">{data.mistakes.length}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-goal">
          <div className="row">
            <span className="mini-icon">
              <Target size={19} />
            </span>
            <strong>A little better, every day.</strong>
          </div>
          <p>
            30 days of focused progress.
            <br />
            One goal that matters to you.
          </p>
          <div className="progress">
            <i style={{ width: `${(courseDays.length / 30) * 100}%` }} />
          </div>
          <div className="row between">
            <span>{courseDays.length} of 30 days complete</span>
            <strong>{Math.round((courseDays.length / 30) * 100)}%</strong>
          </div>
        </div>
        <button className="profile" onClick={() => navigate("Settings")}>
          <span className="avatar">{p.name.slice(0, 1).toUpperCase()}</span>
          <span>
            <strong>{p.name}</strong>
            <small>Academic · Target {p.target.toFixed(1)}</small>
          </span>
          <Settings size={17} />
        </button>
      </aside>
      <div className="main">
        <header className="topbar">
          <div className="row">
            <button
              className="icon-button mobile-menu"
              aria-label="Open menu"
              onClick={() => setMobile(!mobile)}
            >
              <Menu />
            </button>
            <span className="breadcrumb">
              My workspace <ChevronRight size={14} />{" "}
              <strong>{active ? "Practice session" : page}</strong>
            </span>
          </div>
          <div className="topbar-right">
            <span className="day-pill">
              <span /> Day {currentDay} of 30
            </span>
            <span className="top-divider" />
            <span className="countdown">
              <CalendarDays size={16} />
              <b>{daysLeft} days</b> to exam
            </span>
            <button
              className="icon-button"
              aria-label="Switch theme"
              onClick={() =>
                void act({
                  action: "profile",
                  profile: { theme: p.theme === "dark" ? "light" : "dark" },
                }).catch(() => {})
              }
            >
              {p.theme === "dark" ? <Sun size={19} /> : <Moon size={19} />}
            </button>
            <div className="notification-wrap">
              <button
                className="icon-button"
                aria-label="Notifications"
                onClick={() => setNotifications(!notifications)}
              >
                <Bell size={19} />
                {p.notifications && <span className="notification-dot" />}
              </button>
              {notifications && (
                <div className="notification-panel">
                  <h3>Your study reminders</h3>
                  <p>
                    {!p.notifications
                      ? "Notifications are turned off."
                      : courseDays.length
                        ? "Keep your progress going. Your next lesson is ready."
                        : "Start your diagnostic to build a personal baseline."}
                  </p>
                  <p>
                    {
                      data.mistakes.filter(
                        (m: Data) =>
                          m.due <= new Date().toISOString() &&
                          m.status !== "Mastered",
                      ).length
                    }{" "}
                    mistakes are ready to review.
                  </p>
                  <button
                    className="text-button"
                    onClick={() => {
                      setNotifications(false);
                      navigate("Mistake Notebook");
                    }}
                  >
                    Open review notebook
                  </button>
                </div>
              )}
            </div>
            <button
              className="avatar small"
              aria-label="Profile settings"
              onClick={() => navigate("Settings")}
            >
              {p.name.slice(0, 1).toUpperCase()}
            </button>
          </div>
        </header>
        <main
          className={
            active || strategyActive ? "content exam-content" : "content"
          }
        >
          {strategyActive ? (
            <StrategyPractice
              key={strategyActive.id}
              initial={strategyActive}
              onClose={() => setStrategyActive(null)}
              onError={setError}
              onPractice={startStrategy}
              refresh={refresh}
            />
          ) : active ? (
            <PracticePlayer
              activity={content.activities.find(
                (a) => a.id === active.activity_id,
              )!}
              initial={active}
              act={act}
              onClose={() => {
                setActive(null);
                void refresh();
              }}
              onError={setError}
              onStrategy={startStrategy}
              refresh={refresh}
            />
          ) : lesson !== null ? (
            <StrategyLesson
              lesson={content.course[lesson - 1]}
              data={data}
              onBack={() => setLesson(null)}
              onStart={() => {
                const l = content.course[lesson - 1];
                goSkill(l.skill, lesson);
              }}
              act={act}
              catalog={content.strategyCatalog}
              onPractice={startStrategy}
              onStudio={goSkill}
              onError={setError}
              refresh={refresh}
            />
          ) : page === "Dashboard" ? (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">LET’S MAKE TODAY COUNT</div>
                  <h1>
                    {courseDays.length
                      ? "Welcome back"
                      : "Your next chapter starts here"}
                    , {p.name === "Learner" ? "learner" : p.name.split(" ")[0]}
                    <span className="heading-dot">.</span>
                  </h1>
                  <p>
                    Your Band {p.target.toFixed(1)} journey, one focused day at
                    a time.
                  </p>
                </div>
                <button
                  className="outline"
                  onClick={() => navigate("My 30-Day Course")}
                >
                  <CalendarDays size={16} /> View study plan
                </button>
              </div>
              <section className="hero">
                <div className="hero-copy">
                  <span className="hero-tag">
                    <span /> YOUR 30-DAY IELTS SPRINT
                  </span>
                  <h2>
                    A clear plan.
                    <br />A confident you.
                  </h2>
                  <p>
                    You don’t have to master everything today.
                    <br />
                    Just take the next step.
                  </p>
                  <button
                    className="white-button"
                    onClick={() => {
                      setLesson(currentDay);
                      setDay(currentDay);
                    }}
                  >
                    <Play size={16} fill="currentColor" />{" "}
                    {courseDays.length
                      ? "Continue your journey"
                      : "Start Day 1"}
                    <span className="button-separator" />{" "}
                    {courseDays.length
                      ? "Keep moving"
                      : "Find your starting point"}
                  </button>
                </div>
                <div
                  className="hero-art"
                  aria-label={`Target band ${p.target.toFixed(1)}`}
                >
                  <div className="orbit orbit-one" />
                  <div className="orbit orbit-two" />
                  <div className="orbit orbit-three" />
                  <div className="hero-target">
                    <span>YOUR NORTH STAR</span>
                    <strong>{p.target.toFixed(1)}</strong>
                    <span>IELTS TARGET BAND</span>
                  </div>
                  <span className="orbit-star star-one">✦</span>
                  <span className="orbit-star star-two">✧</span>
                  <span className="orbit-label">
                    <Sparkles size={14} /> Progress over perfection
                  </span>
                </div>
              </section>
              <StrategyDashboard
                data={data}
                catalog={content.strategyCatalog}
                day={currentDay}
                onNavigate={navigate}
                onPractice={startStrategy}
              />
              <div className="stats-grid">
                <Stat
                  icon={Target}
                  label="Current estimated band"
                  value="Not assessed"
                  detail="Start with your diagnostic"
                  color="blue"
                />
                <Stat
                  icon={Clock}
                  label="Study time"
                  value={`${(totalSeconds / 3600).toFixed(1)} hrs`}
                  detail={`of ${p.hours * 30} planned hours`}
                  color="violet"
                />
                <Stat
                  icon={Flame}
                  label="Study streak"
                  value={`${streak} ${streak === 1 ? "day" : "days"}`}
                  detail={
                    streak
                      ? "A rhythm worth keeping"
                      : "A fresh start is a good start"
                  }
                  color="orange"
                />
                <Stat
                  icon={Sparkles}
                  label="Learning XP"
                  value={String(xp)}
                  detail="Earned through completed work"
                  color="teal"
                />
              </div>
              <div className="dashboard-columns">
                <section className="panel mission">
                  <div className="section-heading">
                    <div>
                      <h2>
                        Today’s mission{" "}
                        <span className="muted-count">Day {currentDay}</span>
                      </h2>
                      <p>Small steps. Meaningful progress.</p>
                    </div>
                    <div className="mission-completion">
                      {completedSkills.size}
                      <span> / 6 done</span>
                    </div>
                  </div>
                  <div className="mission-progress progress">
                    <i
                      style={{ width: `${(completedSkills.size / 6) * 100}%` }}
                    />
                  </div>
                  {[
                    ["Listening", "Tune in to the details", "35 min"],
                    ["Reading", "Read between the lines", "40 min"],
                    ["Writing", "Put your ideas into words", "45 min"],
                    ["Speaking", "Find your natural voice", "30 min"],
                    ["Grammar", "Build a stronger foundation", "15 min"],
                    ["Vocabulary", "Make new words stick", "15 min"],
                  ].map(([skill, title, time]) => {
                    const Icon = skillIcons[skill],
                      finished = completedSkills.has(skill),
                      attempt = data.attempts.find(
                        (a: Data) => a.skill === skill && !a.submitted_at,
                      );
                    return (
                      <div className="mission-row" key={skill}>
                        <span className={`skill-icon ${skillColors[skill]}`}>
                          <Icon size={20} />
                        </span>
                        <div className="mission-title">
                          <h3>{title}</h3>
                          <span>
                            {skill} <i /> {time} <i /> Intermediate
                          </span>
                        </div>
                        {finished ? (
                          <button
                            className="completed-button"
                            onClick={() => goSkill(skill, currentDay)}
                          >
                            <CheckCircle2 size={18} /> Review
                          </button>
                        ) : (
                          <button
                            className="start-button"
                            onClick={() => goSkill(skill, currentDay)}
                          >
                            {attempt ? "Resume" : "Start"}
                            <ChevronRight size={15} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                  <div className="mission-footer">
                    <Clock size={15} />
                    <span>
                      {Math.round(todaySeconds / 60)} min studied today ·{" "}
                      {Math.round(p.hours * 60)} min planned
                    </span>
                    <span className="tag green">You’ve got this</span>
                  </div>
                </section>
                <div className="right-stack">
                  <section className="panel coach-card">
                    <div className="coach-symbol">
                      <Sparkles size={22} />
                    </div>
                    <Tag color="violet">YOUR PERSONAL COACH</Tag>
                    <h2>
                      A plan that grows
                      <br />
                      with you.
                    </h2>
                    <p>
                      {recommendations.length
                        ? `Your latest ${recommendations[0].skill.toLowerCase()} accuracy is ${recommendations[0].accuracy}%. Review your answer explanations before your next attempt.`
                        : "First, let’s find your starting point. Your diagnostic helps us recommend what to practise next."}
                    </p>
                    <button
                      className="primary full"
                      onClick={() =>
                        recommendations.length
                          ? goSkill(recommendations[0].skill, currentDay)
                          : setLesson(1)
                      }
                    >
                      {recommendations.length
                        ? "Practise your focus skill"
                        : "Take the diagnostic"}
                      <Sparkles size={15} />
                    </button>
                    <span className="coach-note">
                      <ShieldCheck size={13} /> Built around your real progress
                    </span>
                  </section>
                  <section className="panel next-checkpoint">
                    <div className="row between">
                      <span className="skill-icon orange">
                        <Flag size={21} />
                      </span>
                      <Tag color="orange">NEXT CHECKPOINT</Tag>
                    </div>
                    <h3>Your first mini mock</h3>
                    <p>Day 7 · A chance to see how far you’ve come.</p>
                    <button
                      className="text-button"
                      onClick={() => navigate("Mock Test Centre")}
                    >
                      Explore the test centre <ChevronRight size={15} />
                    </button>
                  </section>
                </div>
              </div>
              <section className="skill-section">
                <div className="section-heading">
                  <div>
                    <h2>Your skills, at a glance</h2>
                    <p>Build balance across your English.</p>
                  </div>
                  <button
                    className="text-button"
                    onClick={() => navigate("Performance Analytics")}
                  >
                    View analytics <ChevronRight size={15} />
                  </button>
                </div>
                <div className="skills-grid">
                  {Object.entries(skillIcons).map(([skill, Icon]) => {
                    const attempts = done.filter(
                        (a: Data) => a.skill === skill,
                      ),
                      latest = attempts[0],
                      previous = attempts[1];
                    return (
                      <button
                        className="skill-card"
                        key={skill}
                        onClick={() => goSkill(skill, currentDay)}
                      >
                        <span className={`skill-icon ${skillColors[skill]}`}>
                          <Icon size={20} />
                        </span>
                        <ChevronRight className="card-chevron" size={16} />
                        <h3>{skill}</h3>
                        <strong>
                          {latest
                            ? `${latest.result.accuracy}%`
                            : "Not assessed"}
                        </strong>
                        <span>
                          {latest
                            ? `${attempts.length} completed practices`
                            : "Your baseline starts here"}
                        </span>
                        <div className="progress">
                          <i
                            className={skillColors[skill]}
                            style={{
                              width: `${latest?.result.accuracy || 0}%`,
                            }}
                          />
                        </div>
                        <small>
                          {previous
                            ? `${latest.result.accuracy - previous.result.accuracy >= 0 ? "+" : ""}${latest.result.accuracy - previous.result.accuracy} points since last practice`
                            : latest
                              ? "First practice complete"
                              : "Ready when you are"}
                        </small>
                      </button>
                    );
                  })}
                </div>
              </section>
              <div className="lower-grid">
                <section className="panel">
                  <div className="section-heading">
                    <div>
                      <h2>Your weekly rhythm</h2>
                      <p>Focused study minutes, recorded as you practise.</p>
                    </div>
                    <Tag color="neutral">This week</Tag>
                  </div>
                  <div className="chart">
                    <ResponsiveContainer width="100%" height={200}>
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient
                            id="studyFill"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor="#1659fc"
                              stopOpacity={0.2}
                            />
                            <stop
                              offset="100%"
                              stopColor="#1659fc"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 5" vertical={false} />
                        <XAxis
                          dataKey="name"
                          tickLine={false}
                          axisLine={false}
                          tick={{ fontSize: 12, fill: "#7b8799" }}
                        />
                        <YAxis
                          tickLine={false}
                          axisLine={false}
                          tick={{ fontSize: 12, fill: "#7b8799" }}
                        />
                        <Tooltip />
                        <Area
                          type="monotone"
                          dataKey="minutes"
                          stroke="#1659fc"
                          fill="url(#studyFill)"
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  {!totalSeconds && (
                    <p className="chart-note">
                      Your first practice session will bring this chart to life.
                    </p>
                  )}
                </section>
                <section className="panel consistency">
                  <div className="section-heading">
                    <div>
                      <h2>Show up for yourself</h2>
                      <p>Every completed practice counts.</p>
                    </div>
                    <Flame size={21} className="orange-text" />
                  </div>
                  <div className="consistency-grid">
                    {content.course.map((d) => {
                      const finished = courseDays.some(
                        (s: Data) => s.day === d.day,
                      );
                      return (
                        <button
                          key={d.day}
                          className={`${finished ? "done" : ""} ${d.day === currentDay ? "current" : ""}`}
                          aria-label={`Open day ${d.day}`}
                          onClick={() => {
                            setLesson(d.day);
                            setDay(d.day);
                          }}
                        >
                          {finished ? <Check size={16} /> : d.day}
                        </button>
                      );
                    })}
                  </div>
                  <div className="row between calendar-legend">
                    <span>
                      <i className="legend-dot" /> Complete
                    </span>
                    <span>
                      <i className="legend-dot current" /> Today
                    </span>
                    <span>{courseDays.length}/30 days</span>
                  </div>
                </section>
              </div>
            </>
          ) : page === "My 30-Day Course" ? (
            <>
              <PageHeading
                eyebrow="YOUR ROADMAP"
                title="30 days. A stronger you."
                description="A guided path from finding your baseline to feeling prepared."
              />
              <div className="course-banner">
                <div>
                  <Tag>YOUR STUDY PLAN</Tag>
                  <h2>Consistency is your superpower.</h2>
                  <p>
                    {courseDays.length} days completed · {p.hours} hours a day ·
                    Target Band {p.target.toFixed(1)}
                  </p>
                </div>
                <div className="course-progress-ring">
                  {Math.round((courseDays.length / 30) * 100)}
                  <span>% complete</span>
                </div>
              </div>
              {[0, 1, 2, 3].map((week) => (
                <section className="week-section" key={week}>
                  <div className="section-heading">
                    <h2>
                      Week {week + 1}{" "}
                      <span className="week-title">
                        {
                          [
                            "Foundation & discovery",
                            "Techniques & skill building",
                            "Intensive exam training",
                            "Readiness & refinement",
                          ][week]
                        }
                      </span>
                    </h2>
                    <span>{week === 3 ? "9 days" : "7 days"}</span>
                  </div>
                  <div className="course-grid">
                    {content.course
                      .slice(week * 7, week === 3 ? 30 : week * 7 + 7)
                      .map((d) => (
                        <button
                          className={`lesson-card ${d.day === currentDay ? "today" : ""}`}
                          key={d.day}
                          onClick={() => {
                            setDay(d.day);
                            setLesson(d.day);
                          }}
                        >
                          <div className="row between">
                            <span className="lesson-day">
                              DAY {String(d.day).padStart(2, "0")}
                            </span>
                            {courseDays.some((s: Data) => s.day === d.day) ? (
                              <CheckCircle2 className="green-text" size={20} />
                            ) : (
                              <span
                                className={`tiny-skill ${skillColors[d.skill]}`}
                              >
                                {d.skill}
                              </span>
                            )}
                          </div>
                          <h3>{d.title}</h3>
                          <p>{d.concept}</p>
                          <div className="row between">
                            <span>
                              <Clock size={13} /> {d.minutes} min planned
                            </span>
                            <ChevronRight size={17} />
                          </div>
                          {d.pending && (
                            <span className="pending-note">
                              Full mock content pending
                            </span>
                          )}
                        </button>
                      ))}
                  </div>
                </section>
              ))}
            </>
          ) : [
              "Daily Practice",
              "Listening Lab",
              "Reading Lab",
              "Grammar & Vocabulary",
            ].includes(page) ? (
            <>
              <PageHeading
                eyebrow="PRACTISE WITH PURPOSE"
                title={
                  page === "Daily Practice"
                    ? "Your daily practice space."
                    : page === "Listening Lab"
                      ? "Listen closely. Understand more."
                      : page === "Reading Lab"
                        ? "Read for meaning."
                        : "Strong foundations. Better English."
                }
                description={
                  page === "Listening Lab"
                    ? "Listen, answer, then explore the transcript. Original synthetic-voice audio included."
                    : page === "Reading Lab"
                      ? "Find the evidence, recognise the paraphrase, and build your confidence."
                      : "Real questions, clear explanations, and progress you can come back to."
                }
              />
              <div className="practice-toolbar">
                <div className="search-box">
                  <Search size={18} />
                  <input
                    aria-label="Search practice"
                    placeholder="Find your next practice…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <Tag color="neutral">Original learning content</Tag>
              </div>
              <div className="activity-grid">
                {available
                  .filter((a) =>
                    page === "Daily Practice" || page === "Grammar & Vocabulary"
                      ? page === "Daily Practice" ||
                        ["Grammar", "Vocabulary"].includes(a.skill)
                      : a.skill === page.split(" ")[0],
                  )
                  .map((a) => {
                    const Icon = skillIcons[a.skill],
                      attempt = data.attempts.find(
                        (v: Data) => v.activity_id === a.id && !v.submitted_at,
                      ),
                      last = done.find((v: Data) => v.activity_id === a.id);
                    return (
                      <section className="panel activity-card" key={a.id}>
                        <div className="row between">
                          <span
                            className={`skill-icon large ${skillColors[a.skill]}`}
                          >
                            <Icon size={25} />
                          </span>
                          <Tag color={skillColors[a.skill]}>{a.skill}</Tag>
                        </div>
                        <h2>{a.title}</h2>
                        <p>{a.description}</p>
                        <div className="activity-meta">
                          <span>
                            <Clock size={15} />
                            {a.minutes} min
                          </span>
                          <span>{a.questions.length} questions</span>
                          <span>Intermediate</span>
                        </div>
                        {last && (
                          <p className="result-line">
                            Last result:{" "}
                            <strong>
                              {last.result.correct}/{last.result.total} ·{" "}
                              {last.result.accuracy}%
                            </strong>
                          </p>
                        )}
                        <button
                          className="primary full"
                          onClick={() => void start(a.id, currentDay)}
                        >
                          <Play size={15} />
                          {attempt ? "Resume practice" : "Start practice"}
                        </button>
                      </section>
                    );
                  })}
              </div>
              {page === "Grammar & Vocabulary" && (
                <Vocabulary words={content.words} data={data} act={act} />
              )}
              <section className="panel learning-tip">
                <Lightbulb size={24} />
                <div>
                  <h3>Make practice count</h3>
                  <p>
                    After submitting, explain one mistake in your own words. The
                    answer review and your mistake notebook are here to help.
                  </p>
                </div>
              </section>
            </>
          ) : page === "Writing Studio" ? (
            <WritingStudio
              prompts={content.writingPrompts}
              data={data}
              day={day}
              act={act}
              refresh={refresh}
              onError={setError}
              onNotice={setNotice}
            />
          ) : page === "Speaking Studio" ? (
            <SpeakingStudio
              sets={content.speakingSets}
              data={data}
              day={day}
              refresh={refresh}
              onError={setError}
              onNotice={setNotice}
            />
          ) : page === "Mock Test Centre" ? (
            <>
              <PageHeading
                eyebrow="BUILD YOUR EXAM CONFIDENCE"
                title="Make test day feel familiar."
                description="Practise under pressure, then take the time to understand your results."
              />
              <section className="mock-hero panel">
                <span className="skill-icon large blue">
                  <ShieldCheck size={28} />
                </span>
                <div>
                  <Tag>AVAILABLE NOW</Tag>
                  <h2>Timed reading checkpoint</h2>
                  <p>
                    One original academic passage. Ten questions. Twenty focused
                    minutes.
                  </p>
                  <div className="activity-meta">
                    <span>
                      <Clock size={16} />
                      20 minutes
                    </span>
                    <span>10 questions</span>
                    <span>Auto-submit · Saved answers</span>
                  </div>
                  <p className="subtle">
                    This shortened checkpoint is not a full IELTS examination
                    and does not produce a band estimate.
                  </p>
                  <button
                    className="primary"
                    onClick={() =>
                      void start("reading-1", currentDay, "strict")
                    }
                  >
                    <Play size={16} />
                    Start strict checkpoint
                  </button>
                  <button
                    className="outline"
                    onClick={() => void start("reading-1", currentDay)}
                  >
                    Use practice mode
                  </button>
                </div>
              </section>
              <div className="section-heading">
                <h2>Full-length mock examinations</h2>
                <Tag color="orange">CONTENT IN DEVELOPMENT</Tag>
              </div>
              <div className="activity-grid">
                {[1, 2, 3].map((n) => (
                  <section className="panel pending-card" key={n}>
                    <ShieldCheck size={25} />
                    <h3>Academic full mock {n}</h3>
                    <p>
                      4 Listening parts · 40 questions
                      <br />3 Reading passages · 40 questions
                      <br />
                      Writing Tasks 1 & 2<br />
                      Speaking Parts 1–3
                    </p>
                    <Tag color="neutral">Pending · Not available to start</Tag>
                  </section>
                ))}
              </div>
              <div className="panel info-panel">
                <Lightbulb size={22} />
                <p>
                  Full mock sets will be enabled after their passages, audio,
                  visuals, and answer keys have been reviewed. No shortened
                  activity is presented as a completed full examination.
                </p>
              </div>
              <section className="panel">
                <h2>Checkpoint history</h2>
                {done.filter((a: Data) => a.mode === "strict").length ? (
                  <ResultTable
                    attempts={done.filter((a: Data) => a.mode === "strict")}
                    onReview={setActive}
                  />
                ) : (
                  <Empty
                    icon={ShieldCheck}
                    title="Your first checkpoint awaits"
                  >
                    Completed timed sessions and their actual results will
                    appear here.
                  </Empty>
                )}
              </section>
            </>
          ) : page === "Question Decoder" ? (
            <QuestionDecoder
              catalog={content.strategyCatalog}
              data={data}
              onPractice={startStrategy}
              onStudio={goSkill}
            />
          ) : page === "Strategy Playbook" ? (
            <StrategyPlaybook
              catalog={content.strategyCatalog}
              data={data}
              onPractice={startStrategy}
              onStudio={goSkill}
              onError={setError}
              refresh={refresh}
            />
          ) : page === "Spot the Trap" ? (
            <>
              <PageHeading
                eyebrow="SPOT THE TRAP"
                title="Notice the detail that changes everything."
                description="Identify the misleading pattern, then answer the actual question. Your two results are recorded separately."
              />
              <section className="panel">
                <Tag color="orange">24 ORIGINAL SCENARIOS</Tag>
                <h2>Listening, reading, writing and speaking traps</h2>
                <p>
                  Practise corrections, unsupported generalisations, inaccurate
                  chart claims and underdeveloped responses. Audio and real
                  visual prompts are included where needed.
                </p>
                <button
                  className="primary"
                  onClick={() => void startStrategy("TRAPS", "trap")}
                >
                  Start or resume Spot the Trap
                </button>
              </section>
              <section className="panel">
                <h2>Your trap-recognition evidence</h2>
                <p>
                  {data.strategy.trapSummary.questions
                    ? `${data.strategy.trapSummary.recognised}/${data.strategy.trapSummary.questions} traps recognised · ${data.strategy.trapSummary.answeredCorrectly}/${data.strategy.trapSummary.questions} task answers correct.`
                    : "Not assessed. Complete training to build your evidence."}
                </p>
                {data.strategy.attempts
                  .filter((a: Data) => a.kind === "trap" && a.submitted_at)
                  .map((a: Data) => (
                    <button
                      className="outline"
                      key={a.id}
                      onClick={() => setStrategyActive(a)}
                    >
                      Review training · {a.result.trapAccuracy}% traps
                      recognised
                    </button>
                  ))}
              </section>
            </>
          ) : page === "Score Planner" ? (
            <ScorePlanner data={data} refresh={refresh} onError={setError} />
          ) : page === "Performance Analytics" ? (
            <Analytics
              data={data}
              onReview={setActive}
              onStrategy={startStrategy}
            />
          ) : page === "Mistake Notebook" ? (
            <Mistakes
              data={data}
              act={act}
              onPractise={(id: string) =>
                id.startsWith("strategy:")
                  ? void startStrategy(
                      id.slice(9),
                      "guided",
                      undefined,
                      currentDay,
                    )
                  : void start(id, currentDay)
              }
            />
          ) : page === "AI Tutor" ? (
            <Tutor data={data} refresh={refresh} onError={setError} />
          ) : page === "Settings" ? (
            <SettingsPage
              data={data}
              act={act}
              onError={setError}
              onNotice={setNotice}
            />
          ) : null}
        </main>
      </div>
      {error && (
        <div className="toast error" role="alert">
          <span>{error}</span>
          <button aria-label="Dismiss error" onClick={() => setError("")}>
            <X size={18} />
          </button>
        </div>
      )}
      {notice && (
        <div className="toast success" role="status">
          <CheckCircle2 size={19} />
          {notice}
        </div>
      )}
      {mobile && (
        <button
          className="sidebar-overlay"
          aria-label="Close navigation"
          onClick={() => setMobile(false)}
        />
      )}
    </div>
  );
}
