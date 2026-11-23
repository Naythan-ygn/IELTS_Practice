import test from "node:test";
import assert from "node:assert/strict";
import React, { act, StrictMode } from "react";
import { JSDOM } from "jsdom";
import { Tutor } from "../components/tutor.tsx";

test("Tutor tab mounts, updates and unmounts when scrollIntoView returns a Promise", async () => {
  const dom = new JSDOM(
    '<!DOCTYPE html><html><body><div id="root"></div></body></html>',
    { url: "http://localhost" },
  );
  const replacements: Record<string, unknown> = {
    window: dom.window,
    document: dom.window.document,
    HTMLElement: dom.window.HTMLElement,
    navigator: dom.window.navigator,
    IS_REACT_ACT_ENVIRONMENT: true,
    localStorage: dom.window.localStorage,
  };
  let savedMessages: Record<string, unknown>[] = [];
  const chats = [
    {
      id: "first",
      title: "First conversation",
      context_notes: "",
      window_tokens: 4000,
      draft: "",
      updated_at: "2026-11-24T00:00:00Z",
    },
    {
      id: "second",
      title: "Second conversation",
      context_notes: "",
      window_tokens: 4000,
      draft: "",
      updated_at: "2026-11-24T00:00:00Z",
    },
  ];
  replacements.fetch = async (url: string, init?: RequestInit) => {
    const parsed = new URL(url, "http://localhost");
    if (parsed.pathname !== "/api/tutor/chats")
      throw Error("Unexpected request in Tutor test.");
    if (init?.method === "POST") {
      const body = JSON.parse(String(init.body));
      if (body.action === "create") {
        const chat = { ...chats[0], id: "new", title: "New chat" };
        chats.push(chat);
        return Response.json({ chat });
      }
      throw Error("Unexpected chat mutation.");
    }
    const id = parsed.searchParams.get("id");
    if (id)
      return Response.json({
        chat: chats.find((c) => c.id === id),
        messages: id === "second" ? savedMessages : [],
      });
    return Response.json({
      chats: chats.map((c) => ({
        ...c,
        message_count: c.id === "second" ? savedMessages.length : 0,
      })),
    });
  };
  const originals = new Map(
    Object.keys(replacements).map((key) => [
      key,
      Object.getOwnPropertyDescriptor(globalThis, key),
    ]),
  );
  for (const [key, value] of Object.entries(replacements))
    Object.defineProperty(globalThis, key, {
      configurable: true,
      writable: true,
      value,
    });
  let scrollCalls = 0;
  Object.defineProperty(dom.window.HTMLElement.prototype, "scrollIntoView", {
    configurable: true,
    value: () => {
      scrollCalls++;
      return Promise.resolve();
    },
  });
  const errors: unknown[][] = [],
    originalError = console.error;
  console.error = (...args: unknown[]) => {
    errors.push(args);
  };
  let root:
    ReturnType<(typeof import("react-dom/client"))["createRoot"]> | undefined;
  let unmounted = false;
  try {
    const { createRoot } = await import("react-dom/client");
    root = createRoot(dom.window.document.getElementById("root")!);
    const data = {
      messages: [] as Record<string, unknown>[],
      aiEnabled: false,
      profile: { name: "Learner" },
    };
    const view = () =>
      React.createElement(
        StrictMode,
        null,
        React.createElement(Tutor, {
          data,
          refresh: async () => {},
          onError: () => {},
        }),
      );
    await act(async () => {
      root!.render(view());
    });
    assert.match(
      dom.window.document.body.textContent || "",
      /Meet your study companion/,
    );
    savedMessages = [
      { id: "question", role: "user", body: "Teach me True/False/Not Given." },
      {
        id: "reply",
        role: "assistant",
        body: "## Reading strategy\n\nCompare the statement with the passage evidence.\n\n**Check the evidence.**",
      },
    ];
    await act(async () => {
      const button = [...dom.window.document.querySelectorAll("button")].find(
        (b) => b.textContent?.includes("Second conversation"),
      )!;
      button.click();
    });
    assert.match(
      dom.window.document.body.textContent || "",
      /Compare the statement/,
    );
    assert.equal(
      dom.window.document.querySelector(".markdown-response h2")?.textContent,
      "Reading strategy",
    );
    assert.equal(
      dom.window.document.querySelector(".markdown-response strong")
        ?.textContent,
      "Check the evidence.",
    );
    await act(async () => {
      const button = [...dom.window.document.querySelectorAll("button")].find(
        (b) => b.textContent?.trim() === "New chat",
      )!;
      button.click();
    });
    assert.ok(
      !dom.window.document.body.textContent?.includes(
        "Compare the statement with the passage evidence.",
      ),
    );
    assert.equal(
      chats.length,
      3,
      "New Chat should create a separate conversation.",
    );
    await act(async () => {
      [...dom.window.document.querySelectorAll("button")]
        .find((b) => b.textContent?.includes("Second conversation"))!
        .click();
    });
    assert.match(
      dom.window.document.body.textContent || "",
      /Compare the statement/,
    );
    await act(async () => {
      root!.unmount();
    });
    unmounted = true;
    assert.ok(
      scrollCalls >= 3,
      "Strict Mode remount and new messages should trigger scrolling.",
    );
    assert.deepEqual(
      errors,
      [],
      "There must be no invalid effect cleanup warnings.",
    );
  } finally {
    if (root && !unmounted) {
      try {
        await act(async () => {
          root!.unmount();
        });
      } catch {}
    }
    console.error = originalError;
    dom.window.close();
    for (const [key, descriptor] of originals) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }
  }
});
