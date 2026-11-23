import test from "node:test";
import assert from "node:assert/strict";
import { aiStatus, requestAI, AIError } from "../lib/ai.ts";
const env = {
  AI_PROVIDER: "openrouter",
  OPENROUTER_API_KEY: "test-only-secret",
  OPENROUTER_MODEL: "openai/gpt-4.1-mini",
};
const fake = (
  handler: (url: string, init: RequestInit) => Response | Promise<Response>,
) =>
  ((url: any, init: any) =>
    Promise.resolve(handler(String(url), init))) as typeof fetch;
test("provider status never exposes keys and explicit provider never silently falls back", () => {
  assert.equal(aiStatus(env).enabled, true);
  assert.equal(
    aiStatus({ OPENROUTER_API_KEY: "test-key" }).provider,
    "OpenRouter",
  );
  assert.equal(aiStatus({ OPENAI_API_KEY: "legacy-key" }).provider, "OpenAI");
  assert.equal(
    aiStatus({ AI_PROVIDER: "openrouter", OPENAI_API_KEY: "legacy-key" })
      .enabled,
    false,
  );
  assert.equal(aiStatus({ AI_PROVIDER: "unsupported" }).enabled, false);
  assert.ok(!JSON.stringify(aiStatus(env)).includes(env.OPENROUTER_API_KEY));
});
test("OpenRouter request uses its own endpoint, Bearer key and chat message schema", async () => {
  let called = 0;
  const result = await requestAI(
    "Tutor instructions",
    "Review this saved answer",
    {
      env,
      fetcher: fake((url, init) => {
        called++;
        assert.equal(url, "https://openrouter.ai/api/v1/chat/completions");
        assert.equal(
          (init.headers as any).Authorization,
          "Bearer test-only-secret",
        );
        const body = JSON.parse(String(init.body));
        assert.equal(body.model, env.OPENROUTER_MODEL);
        assert.equal(body.messages[0].role, "system");
        assert.equal(body.messages[1].content, "Review this saved answer");
        assert.equal(body.stream, false);
        assert.ok(!String(init.body).includes(env.OPENROUTER_API_KEY));
        return Response.json({
          choices: [
            {
              message: { content: "Use the final corrected date." },
              finish_reason: "stop",
            },
          ],
        });
      }),
    },
  );
  assert.equal(called, 1);
  assert.equal(result.answer, "Use the final corrected date.");
  assert.equal(result.provider, "OpenRouter");
});
test("direct OpenAI integration remains supported", async () => {
  const result = await requestAI("Instructions", "Input", {
    env: { AI_PROVIDER: "openai", OPENAI_API_KEY: "test-key" },
    fetcher: fake((url, init) => {
      assert.equal(url, "https://api.openai.com/v1/responses");
      assert.equal(JSON.parse(String(init.body)).input, "Input");
      return Response.json({
        output: [
          { content: [{ type: "output_text", text: "Useful feedback." }] },
        ],
      });
    }),
  });
  assert.equal(result.answer, "Useful feedback.");
  assert.equal(result.provider, "OpenAI");
});
test("OpenAI receives chronological conversation roles when chat memory is supplied", async () => {
  await requestAI("Instructions", "Follow-up", {
    env: { AI_PROVIDER: "openai", OPENAI_API_KEY: "test-key" },
    history: [
      { role: "user", content: "Earlier question" },
      { role: "assistant", content: "Earlier answer" },
    ],
    fetcher: fake((_url, init) => {
      assert.deepEqual(JSON.parse(String(init.body)).input, [
        { role: "user", content: "Earlier question" },
        { role: "assistant", content: "Earlier answer" },
        { role: "user", content: "Follow-up" },
      ]);
      return Response.json({
        output: [
          {
            content: [{ type: "output_text", text: "Context-aware response." }],
          },
        ],
      });
    }),
  });
});
test("authentication, credits, rate limits, empty and truncated replies fail honestly without leaking provider errors", async () => {
  for (const status of [401, 402, 403, 404, 429, 500]) {
    await assert.rejects(
      () =>
        requestAI("I", "Q", {
          env,
          fetcher: fake(
            () =>
              new Response("sensitive echoed key: test-only-secret", {
                status,
              }),
          ),
        }),
      (error: any) =>
        error instanceof AIError && !error.message.includes("test-only-secret"),
    );
  }
  for (const payload of [
    { error: { message: "test-only-secret" } },
    { choices: [] },
    { choices: [{ message: { content: "partial" }, finish_reason: "length" }] },
  ])
    await assert.rejects(
      () =>
        requestAI("I", "Q", {
          env,
          fetcher: fake(() => Response.json(payload)),
        }),
      AIError,
    );
  await assert.rejects(
    () =>
      requestAI("I", "Q", {
        env,
        fetcher: fake(() => {
          throw new DOMException("timeout", "TimeoutError");
        }),
      }),
    (e: any) => e.status === 504,
  );
});
test("no key means no network request", async () => {
  let called = false;
  await assert.rejects(
    () =>
      requestAI("I", "Q", {
        env: { AI_PROVIDER: "openrouter" },
        fetcher: fake(() => {
          called = true;
          return Response.json({});
        }),
      }),
    AIError,
  );
  assert.equal(called, false);
});
