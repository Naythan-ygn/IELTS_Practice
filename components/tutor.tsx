"use client";
import { MarkdownResponse } from "./markdown-response";
import {
  Plus,
  Send,
  Sparkles,
  MessageSquare,
  Search,
  Brain,
  Save,
  Clock,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Data } from "./ui";
import { PageHeading, request, Tag } from "./ui";
import { buildChatMemory, CHAT_WINDOWS } from "@/lib/chat-memory";
const activeChatKey = "ielts-sprint-active-tutor-chat";
export function Tutor({ data, refresh, onError }: Data) {
  const [chats, setChats] = useState<Data[]>([]),
    [active, setActive] = useState<Data | null>(null),
    [messages, setMessages] = useState<Data[]>([]),
    [message, setMessage] = useState(""),
    [search, setSearch] = useState(""),
    [title, setTitle] = useState("New chat"),
    [notes, setNotes] = useState(""),
    [windowTokens, setWindowTokens] = useState(4000),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(true),
    [saving, setSaving] = useState(false),
    [draftStatus, setDraftStatus] = useState("Draft saved"),
    [error, setError] = useState("");
  const end = useRef<HTMLDivElement>(null),
    chain = useRef<Promise<any>>(Promise.resolve()),
    lastSavedDraft = useRef(""),
    current = useRef({ id: active?.id, message });
  const busyRef = useRef(busy);
  busyRef.current = busy;
  current.current = { id: active?.id, message };
  useEffect(
    () => () => {
      const draft = { ...current.current };
      if (
        draft.id &&
        draft.message !== lastSavedDraft.current &&
        !busyRef.current
      ) {
        void chain.current
          .catch(() => {})
          .then(() =>
            fetch("/api/tutor/chats", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "update",
                id: draft.id,
                changes: { draft: draft.message },
              }),
              keepalive: true,
            }),
          )
          .catch(() => {});
      }
    },
    [],
  );
  function report(e: unknown) {
    const text = (e as Error).message;
    setError(text);
    onError?.(text);
  }
  function applyChat(result: Data) {
    setActive(result.chat);
    setMessages(result.messages || []);
    setMessage(result.chat.draft || "");
    lastSavedDraft.current = result.chat.draft || "";
    setTitle(result.chat.title);
    setNotes(result.chat.context_notes || "");
    setWindowTokens(result.chat.window_tokens);
    setDraftStatus("Draft saved");
    try {
      localStorage.setItem(activeChatKey, result.chat.id);
    } catch {}
  }
  async function loadList() {
    const result = await request("/api/tutor/chats");
    setChats(result.chats);
    return result.chats as Data[];
  }
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const list = await request("/api/tutor/chats");
        if (cancelled) return;
        setChats(list.chats);
        let remembered = "";
        try {
          remembered = localStorage.getItem(activeChatKey) || "";
        } catch {}
        const selected =
          list.chats.find((c: Data) => c.id === remembered) || list.chats[0];
        if (selected) {
          const result = await request(
            `/api/tutor/chats?id=${encodeURIComponent(selected.id)}`,
          );
          if (!cancelled) applyChat(result);
        }
      } catch (e) {
        if (!cancelled) report(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, active?.id, busy]);
  useEffect(() => {
    if (!active?.busy || busy) return;
    let cancelled = false,
      inFlight = false;
    const id = active.id;
    const timer = setInterval(async () => {
      if (inFlight) return;
      inFlight = true;
      try {
        const result = await request(
          `/api/tutor/chats?id=${encodeURIComponent(id)}`,
        );
        if (!cancelled && current.current.id === id) {
          applyChat(result);
          if (!result.chat.busy) await loadList();
        }
      } catch {
        /* Keep the saved draft; a later poll or reload can recover it. */
      } finally {
        inFlight = false;
      }
    }, 2000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [active?.id, active?.busy, busy]);
  function queueSave(id: string, draft: string) {
    setDraftStatus("Saving draft…");
    chain.current = chain.current
      .catch(() => {})
      .then(() =>
        request("/api/tutor/chats", {
          action: "update",
          id,
          changes: { draft },
        }),
      )
      .then((result) => {
        if (current.current.id === id) {
          lastSavedDraft.current = draft;
          setDraftStatus(
            current.current.message === draft
              ? "Draft saved"
              : "New changes pending",
          );
        }
        return result;
      });
    return chain.current;
  }
  useEffect(() => {
    if (
      !active ||
      active.busy ||
      busy ||
      loading ||
      message === lastSavedDraft.current
    )
      return;
    const timer = setTimeout(
      () =>
        void queueSave(active.id, message).catch((e) => {
          setDraftStatus("Draft not saved");
          setError(e.message);
        }),
      750,
    );
    return () => clearTimeout(timer);
  }, [message, active?.id, active?.busy, busy, loading]);
  async function flushDraft() {
    await chain.current.catch(() => {});
    if (active && message !== lastSavedDraft.current)
      await queueSave(active.id, message);
  }
  async function selectChat(id: string) {
    if (busy || loading || saving || id === active?.id) return;
    setLoading(true);
    setError("");
    try {
      await flushDraft();
      applyChat(await request(`/api/tutor/chats?id=${encodeURIComponent(id)}`));
    } catch (e) {
      report(e);
    } finally {
      setLoading(false);
    }
  }
  async function newChat() {
    if (busy || loading || saving) return;
    setLoading(true);
    setError("");
    try {
      await flushDraft();
      const result = await request("/api/tutor/chats", { action: "create" });
      applyChat({ chat: result.chat, messages: [] });
      await loadList();
    } catch (e) {
      report(e);
    } finally {
      setLoading(false);
    }
  }
  async function saveContext() {
    if (!active || busy || active.busy || saving) return;
    setSaving(true);
    setError("");
    try {
      await chain.current.catch(() => {});
      const result = await request("/api/tutor/chats", {
        action: "update",
        id: active.id,
        changes: { title, contextNotes: notes, windowTokens, draft: message },
      });
      setActive(result.chat);
      lastSavedDraft.current = message;
      setDraftStatus("Draft saved");
      await loadList();
    } catch (e) {
      report(e);
    } finally {
      setSaving(false);
    }
  }
  let memory: Data | null = null,
    memoryError = "";
  try {
    memory = buildChatMemory(
      messages.map((m) => ({ role: m.role, content: m.body })),
      message,
      notes,
      windowTokens,
    ).summary;
  } catch (e) {
    memoryError = (e as Error).message;
  }
  async function send() {
    if (
      !message.trim() ||
      busy ||
      active?.busy ||
      loading ||
      saving ||
      memoryError ||
      !data.aiEnabled
    )
      return;
    setBusy(true);
    setError("");
    try {
      await chain.current.catch(() => {});
      let id = active?.id;
      if (!id) {
        const result = await request("/api/tutor/chats", { action: "create" });
        id = result.chat.id;
        setActive(result.chat);
      }
      await request("/api/tutor/chats", {
        action: "update",
        id,
        changes: { title, contextNotes: notes, windowTokens, draft: message },
      });
      const result = await request("/api/tutor", { chatId: id, message });
      applyChat(
        await request(
          `/api/tutor/chats?id=${encodeURIComponent(result.chatId)}`,
        ),
      );
      await loadList();
      await refresh?.();
    } catch (e) {
      report(e);
    } finally {
      setBusy(false);
    }
  }
  const filtered = chats.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <>
      <PageHeading
        eyebrow="A LITTLE GUIDANCE GOES A LONG WAY"
        title="Meet your study companion."
        description="Keep separate conversations, revisit your history, and choose what your tutor remembers."
      />
      <div className="tutor-workspace">
        <aside className="panel tutor-history">
          <div className="section-heading">
            <h2>Chat history</h2>
            <MessageSquare size={19} />
          </div>
          <button
            className="primary full"
            disabled={busy || loading || saving}
            onClick={() => void newChat()}
          >
            <Plus size={17} />
            New chat
          </button>
          <div className="search-box">
            <Search size={16} />
            <input
              aria-label="Search chat titles"
              placeholder="Search chat titles…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="tutor-chat-list">
            {filtered.map((chat) => (
              <button
                key={chat.id}
                className={active?.id === chat.id ? "active" : ""}
                disabled={busy || loading || saving}
                onClick={() => void selectChat(chat.id)}
              >
                <MessageSquare size={15} />
                <span>
                  <strong>{chat.title}</strong>
                  <small>
                    {chat.message_count || 0} messages ·{" "}
                    {new Date(chat.updated_at).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      timeZone: "Asia/Rangoon",
                    })}
                  </small>
                </span>
              </button>
            ))}
            {!loading && !filtered.length && (
              <p className="subtle">
                {search
                  ? "No matching chat titles."
                  : "Your saved conversations will appear here."}
              </p>
            )}
          </div>
          <p className="subtle">
            Each chat has its own history and pinned context. Starting a new
            chat keeps your previous conversations.
          </p>
        </aside>
        <section className="panel tutor-panel">
          <div className="tutor-header">
            <span className="coach-symbol">
              <Sparkles size={22} />
            </span>
            <div>
              <h3>{active?.title || "Sprint tutor"}</h3>
              <span>
                {data.aiEnabled
                  ? `AI configured · ${data.ai?.provider || "AI provider"} · Unofficial guidance`
                  : "AI not connected · Server configuration required"}
              </span>
            </div>
            <Tag color={data.aiEnabled ? "green" : "neutral"}>
              {data.aiEnabled ? "Available" : "Offline"}
            </Tag>
          </div>
          <details className="tutor-memory">
            <summary>
              <Brain size={18} />
              <strong>Chat memory</strong>
              <span>
                {memory
                  ? `~${memory.estimatedTokens.toLocaleString()} / ${windowTokens.toLocaleString()} tokens`
                  : "Window exceeded"}
              </span>
            </summary>
            <div className="memory-settings">
              <div className="memory-fields">
                <label>
                  Chat title
                  <input
                    value={title}
                    maxLength={80}
                    disabled={busy || loading || !!active?.busy}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </label>
                <label>
                  Conversation window
                  <select
                    value={windowTokens}
                    disabled={busy || loading || !!active?.busy}
                    onChange={(e) => setWindowTokens(Number(e.target.value))}
                  >
                    {CHAT_WINDOWS.map((n) => (
                      <option key={n} value={n}>
                        {n / 1000}k estimated tokens
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label>
                Pinned context for this chat
                <textarea
                  rows={3}
                  maxLength={2000}
                  disabled={busy || loading || !!active?.busy}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="For example: Help me distinguish False from Not Given. Keep explanations simple."
                />
              </label>
              <p className="subtle">
                Pinned notes stay in the active context. Recent complete turns
                fill the remaining space, up to 24 turns. Older messages stay
                saved in history. Token counts are estimates for conversation
                memory; model instructions, study context and the reply use
                additional tokens.
              </p>
              <div className="progress">
                <i
                  style={{
                    width: `${Math.min(100, ((memory?.estimatedTokens || 0) / windowTokens) * 100)}%`,
                  }}
                />
              </div>
              <div className="memory-status">
                <span>
                  {memory?.retainedMessages || 0} of {messages.length} past
                  messages active
                  {memory?.omittedMessages
                    ? ` · ${memory.omittedMessages} older messages outside this window`
                    : ""}
                </span>
                <button
                  className="outline"
                  disabled={
                    !active ||
                    busy ||
                    active?.busy ||
                    loading ||
                    saving ||
                    !!memoryError
                  }
                  onClick={() => void saveContext()}
                >
                  <Save size={15} />
                  {saving ? "Saving…" : "Save context"}
                </button>
              </div>
              {memoryError && <p className="callout warning">{memoryError}</p>}
            </div>
          </details>
          <div className="chat-messages" aria-live="polite">
            {loading ? (
              <p className="subtle">Loading your conversation…</p>
            ) : !messages.length ? (
              <div className="tutor-welcome">
                <span className="tutor-large-icon">
                  <Sparkles size={32} />
                </span>
                <h2>What would you like to work on?</h2>
                <p>
                  Your tutor uses the active chat memory and relevant study
                  progress to guide you.
                </p>
                <div className="suggestion-grid">
                  {[
                    "Teach me True/False/Not Given.",
                    "Help me plan a Task 2 introduction.",
                    "Explain subject–verb agreement in Burmese.",
                    "Summarise my recent practice and suggest a next step.",
                  ].map((text) => (
                    <button
                      key={text}
                      disabled={busy || !!active?.busy}
                      onClick={() => setMessage(text)}
                    >
                      {text}
                      <Plus size={17} />
                    </button>
                  ))}
                </div>
                {!data.aiEnabled && (
                  <div className="callout">
                    Set AI_PROVIDER=openrouter and OPENROUTER_API_KEY in the
                    server’s .env.local file and restart the app. You can create
                    chats, save context and browse history without AI.
                  </div>
                )}
              </div>
            ) : (
              messages.map((m) => (
                <div className={`chat-message ${m.role}`} key={m.id}>
                  <span className="chat-avatar">
                    {m.role === "assistant" ? (
                      <Sparkles size={16} />
                    ) : (
                      data.profile.name.slice(0, 1)
                    )}
                  </span>
                  <div>
                    <strong>
                      {m.role === "assistant" ? "Sprint tutor" : "You"}
                    </strong>
                    {m.role === "assistant" ? (
                      <MarkdownResponse>{m.body}</MarkdownResponse>
                    ) : (
                      <p>{m.body}</p>
                    )}
                  </div>
                </div>
              ))
            )}
            {(busy || active?.busy) && (
              <div className="chat-message assistant">
                <Sparkles size={18} />
                <p>Thinking through your question…</p>
              </div>
            )}
            <div ref={end} />
          </div>
          {error && (
            <p className="tutor-chat-error" role="alert">
              {error}
            </p>
          )}
          <form
            className="chat-composer"
            onSubmit={(e) => {
              e.preventDefault();
              void send();
            }}
          >
            <textarea
              aria-label="Message your tutor"
              value={message}
              rows={2}
              maxLength={10000}
              disabled={busy || loading || !!active?.busy}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  void send();
                }
              }}
              placeholder="Ask about your IELTS practice…"
            />
            <button
              className="primary"
              type="submit"
              disabled={
                busy ||
                !!active?.busy ||
                loading ||
                saving ||
                !message.trim() ||
                !data.aiEnabled ||
                !!memoryError
              }
              aria-label="Send message"
            >
              <Send size={19} />
            </button>
          </form>
          <div className="tutor-composer-meta">
            <span>
              <Clock size={12} />
              {active?.busy
                ? "Reply in progress · draft saved"
                : active
                  ? draftStatus
                  : "A new chat starts when you send"}
            </span>
            <span>Ctrl / ⌘ + Enter to send</span>
          </div>
          <p className="chat-note">
            AI can make mistakes. Guidance and band estimates are unofficial.
          </p>
        </section>
      </div>
    </>
  );
}
