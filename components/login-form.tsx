"use client";
import { useState } from "react";
import { ArrowRight, Heart, LockKeyhole, Sparkles } from "lucide-react";
export function LoginForm() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function signIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fields = new FormData(e.currentTarget);
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: fields.get("username"),
          password: fields.get("password"),
        }),
      });
      const result = await res.json();
      if (!res.ok)
        throw Error(result.error || "Unable to sign in. Please try again.");
      window.location.assign("/");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to sign in. Please try again.",
      );
      setBusy(false);
    }
  }
  return (
    <main className="login-page">
      <div className="login-orbit" aria-hidden="true" />
      <section className="login-card">
        <div className="login-story">
          <span className="login-brand">
            <Sparkles size={19} /> IELTS SPRINT 30
          </span>
          <div className="login-story-copy">
            <span className="login-heart">
              <Heart size={32} />
            </span>
            <p className="login-dedication">A Present for My Lovely Soulmate</p>
            <h1>
              Your dreams.
              <br />
              Our little journey.
            </h1>
            <p>
              A little practice, a little courage, and so much love. Your next
              chapter starts here.
            </p>
          </div>
          <span className="login-small">
            Thirty days. One beautiful beginning.
          </span>
        </div>
        <div className="login-form-panel">
          <span className="login-lock">
            <LockKeyhole size={23} />
          </span>
          <p className="login-eyebrow">YOUR PERSONAL STUDY SPACE</p>
          <h2>Welcome, lovely.</h2>
          <p className="login-intro">
            Sign in and take one more step towards your dream.
          </p>
          <form onSubmit={signIn}>
            <label htmlFor="username">User name</label>
            <input
              id="username"
              name="username"
              autoComplete="username"
              required
              maxLength={128}
              placeholder="Enter your user name"
              disabled={busy}
            />
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              maxLength={1024}
              placeholder="Enter your password"
              disabled={busy}
            />
            {error && (
              <p className="login-error" role="alert">
                {error}
              </p>
            )}
            <button className="login-submit" disabled={busy}>
              {busy ? "Signing in…" : "Enter your study space"}
              <ArrowRight size={18} />
            </button>
          </form>
          <p className="login-reassurance">
            <Heart size={13} /> A space made just for you.
          </p>
        </div>
      </section>
    </main>
  );
}
