"use client";
import { AIReviewPanel } from "./ai-review";
import {
  AudioLines,
  Bookmark,
  Clock,
  Lightbulb,
  Mic,
  Square,
  Volume2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Data } from "./ui";
import { clock, dateLabel, Empty, PageHeading, Tag } from "./ui";
export function SpeakingStudio({
  sets,
  data,
  day,
  refresh,
  onError,
  onNotice,
}: Data) {
  const [index, setIndex] = useState(0),
    [part, setPart] = useState(1),
    [recording, setRecording] = useState(false),
    [blob, setBlob] = useState<Blob | null>(null),
    [url, setUrl] = useState(""),
    [seconds, setSeconds] = useState(0),
    [transcript, setTranscript] = useState(""),
    [prep, setPrep] = useState<number | null>(null),
    [saving, setSaving] = useState(false);
  const recorder = useRef<MediaRecorder | null>(null),
    stream = useRef<MediaStream | null>(null),
    capturedPrompt = useRef(""),
    capturedDay = useRef(1),
    startTime = useRef(0),
    set = sets[index],
    prompt =
      part === 1
        ? set.part1.join("\n")
        : part === 2
          ? set.cue
          : set.part3.join("\n");
  useEffect(() => {
    if (!recording) return;
    const t = setInterval(() => {
      const elapsed = Math.round((Date.now() - startTime.current) / 1000);
      setSeconds(elapsed);
      if (elapsed >= (part === 2 ? 120 : 300)) recorder.current?.stop();
    }, 250);
    return () => clearInterval(t);
  }, [recording, part]);
  useEffect(() => {
    if (prep === null || prep <= 0) return;
    const t = setTimeout(() => setPrep(prep - 1), 1000);
    return () => clearTimeout(t);
  }, [prep]);
  useEffect(
    () => () => {
      stream.current?.getTracks().forEach((t) => t.stop());
      if (recorder.current?.state === "recording") recorder.current.stop();
    },
    [],
  );
  useEffect(() => {
    if (!blob) return;
    const preview = URL.createObjectURL(blob);
    setUrl(preview);
    return () => URL.revokeObjectURL(preview);
  }, [blob]);
  async function begin() {
    try {
      if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder)
        throw Error(
          "Recording is not supported in this browser. Use a current browser on localhost or HTTPS.",
        );
      const s = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.current = s;
      const type = [
        "audio/webm;codecs=opus",
        "audio/mp4",
        "audio/ogg;codecs=opus",
      ].find((t) => MediaRecorder.isTypeSupported(t));
      const r = new MediaRecorder(s, type ? { mimeType: type } : undefined),
        chunks: BlobPart[] = [];
      recorder.current = r;
      capturedPrompt.current = prompt;
      capturedDay.current = day;
      r.ondataavailable = (e) => {
        if (e.data.size) chunks.push(e.data);
      };
      r.onstop = () => {
        setBlob(new Blob(chunks, { type: r.mimeType }));
        setRecording(false);
        s.getTracks().forEach((t) => t.stop());
      };
      r.onerror = () => {
        setRecording(false);
        s.getTracks().forEach((t) => t.stop());
        onError("Recording failed. Please check your microphone and retry.");
      };
      startTime.current = Date.now();
      setSeconds(0);
      setBlob(null);
      setTranscript("");
      setRecording(true);
      r.start(1000);
    } catch (e) {
      onError(
        (e as Error).name === "NotAllowedError"
          ? "Microphone access was denied. Allow microphone access in your browser settings, then try again."
          : (e as Error).message,
      );
    }
  }
  return (
    <>
      <PageHeading
        eyebrow="SPEAKING STUDIO"
        title="Let your voice be heard."
        description="A comfortable place to practise, record, and reflect on your English."
      />
      <div className="studio-toolbar">
        <label>
          Interview topic
          <select
            value={index}
            disabled={recording}
            onChange={(e) => {
              setIndex(Number(e.target.value));
              setPrep(null);
            }}
          >
            {sets.map((s: Data, i: number) => (
              <option key={i} value={i}>
                {s.title}
              </option>
            ))}
          </select>
        </label>
        <Tag color="teal">Guided recording & self-review</Tag>
      </div>
      <div className="tabs">
        {[1, 2, 3].map((n) => (
          <button
            key={n}
            disabled={recording}
            className={part === n ? "active" : ""}
            onClick={() => {
              setPart(n);
              setPrep(null);
            }}
          >
            Part {n}
            <span>
              {["The interview", "The long turn", "The discussion"][n - 1]}
            </span>
          </button>
        ))}
      </div>
      <div className="speaking-layout">
        <section className="panel speaking-prompt">
          <Tag color="teal">YOUR EXAMINER PROMPT</Tag>
          <h2>
            {part === 2
              ? "Take a moment. Tell your story."
              : part === 1
                ? "Let’s talk about you."
                : "Let’s look at the bigger picture."}
          </h2>
          <div className="speaking-questions">
            {prompt.split("\n").map((q: string, i: number) => (
              <p key={i}>
                <span>
                  {part === 2 ? (
                    <Bookmark size={19} />
                  ) : (
                    String(i + 1).padStart(2, "0")
                  )}
                </span>
                {q}
              </p>
            ))}
          </div>
          {part === 2 && (
            <div className="prep-timer">
              <Clock size={22} />
              <div>
                <strong>
                  {prep === null
                    ? "One minute to prepare"
                    : prep === 0
                      ? "Preparation finished"
                      : `${clock(prep)} to prepare`}
                </strong>
                <p>Make a few notes. Then speak for up to two minutes.</p>
              </div>
              <button className="outline" onClick={() => setPrep(60)}>
                Start preparation
              </button>
            </div>
          )}
          <button
            className="text-button"
            disabled={recording}
            onClick={() => {
              if ("speechSynthesis" in window) {
                window.speechSynthesis.cancel();
                const u = new SpeechSynthesisUtterance(prompt);
                u.lang = "en-GB";
                window.speechSynthesis.speak(u);
              } else
                onError("Question read-aloud is unavailable in this browser.");
            }}
          >
            <Volume2 size={17} />
            Hear the questions
          </button>
          <div className="worked-example">
            <span>
              <Lightbulb size={16} />A LITTLE GUIDANCE
            </span>
            <p>
              Give a direct answer, explain why, and add a specific example. Aim
              for natural meaning rather than a memorised script.
            </p>
          </div>
        </section>
        <section className="panel recorder-panel">
          <div className={`recording-orb ${recording ? "recording" : ""}`}>
            <Mic size={37} />
          </div>
          <h2>
            {recording ? "You’re recording." : "Your voice. Your progress."}
          </h2>
          <p>
            {recording
              ? "Take your time and keep your ideas connected."
              : "Speak naturally. You can listen back before saving."}
          </p>
          <strong className="recording-time">{clock(seconds)}</strong>
          <button
            className={recording ? "danger" : "primary"}
            onClick={() =>
              recording ? recorder.current?.stop() : void begin()
            }
          >
            {recording ? (
              <Square size={16} fill="currentColor" />
            ) : (
              <Mic size={17} />
            )}{" "}
            {recording ? "Finish recording" : "Start recording"}
          </button>
          {url && (
            <div className="recording-preview">
              <audio controls src={url} />
              <label>
                Transcript or self-review notes
                <textarea
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  rows={4}
                  placeholder="Type what you said, or note what you’d like to improve…"
                />
              </label>
              <p className="subtle">
                Automatic transcription and audio assessment are not connected.
                This recording has not been analysed. Pronunciation cannot be
                assessed from typed text.
              </p>
              <button
                className="primary full"
                disabled={saving}
                onClick={async () => {
                  setSaving(true);
                  try {
                    const form = new FormData();
                    form.set("audio", blob!, "response.webm");
                    form.set("duration", String(seconds));
                    form.set("day", String(capturedDay.current));
                    form.set("prompt", capturedPrompt.current);
                    form.set("transcript", transcript);
                    const r = await fetch("/api/recordings", {
                        method: "POST",
                        body: form,
                      }),
                      b = await r.json();
                    if (!r.ok) throw Error(b.error);
                    await refresh();
                    setBlob(null);
                    setUrl("");
                    onNotice("Recording saved privately for self-review.");
                  } catch (e) {
                    onError((e as Error).message);
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                {saving ? "Saving…" : "Save recording & notes"}
              </button>
            </div>
          )}
        </section>
      </div>
      <section className="panel recording-history">
        <h2>Your speaking journal</h2>
        {data.recordings.length ? (
          data.recordings.map((r: Data) => (
            <div className="recording-row" key={r.id}>
              <span className="skill-icon teal">
                <AudioLines size={21} />
              </span>
              <div>
                <h3>{r.prompt.split("\n")[0]}</h3>
                <span className="subtle">
                  {dateLabel(r.created_at)} · {clock(r.duration)} · Self-review
                </span>
                {r.transcript && (
                  <>
                    <p>{r.transcript}</p>
                    <AIReviewPanel
                      kind="recording"
                      sourceId={r.id}
                      onError={onError}
                    />
                  </>
                )}
              </div>
              <audio
                controls
                preload="none"
                src={`/api/recordings?id=${r.id}`}
              />
            </div>
          ))
        ) : (
          <Empty icon={Mic} title="Your first recording starts here">
            Record a response and save it to build a personal speaking journal.
          </Empty>
        )}
      </section>
    </>
  );
}
