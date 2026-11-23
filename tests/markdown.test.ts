import test from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MarkdownResponse } from "../components/markdown-response.tsx";
test("Tutor Markdown renders headings, emphasis, lists, tables and code safely", () => {
  const html = renderToStaticMarkup(
    createElement(MarkdownResponse, {
      children:
        "## Feedback\n\n**Great work**\n\n- Evidence\n- Correction\n\n| Skill | Tip |\n| --- | --- |\n| Reading | Scan |\n\n```text\nExample\n```\n\n[Guide](https://example.com)\n\n<script>alert(1)</script>\n\n[unsafe](javascript:alert(1))",
    }),
  );
  for (const expected of [
    "<h2>Feedback</h2>",
    "<strong>Great work</strong>",
    "<ul>",
    "<table>",
    "<pre>",
    "noopener noreferrer",
  ])
    assert.ok(html.includes(expected), expected);
  assert.ok(!html.includes("<script"));
  assert.ok(!html.includes("javascript:"));
});
