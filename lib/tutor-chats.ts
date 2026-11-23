import { randomUUID } from "node:crypto";
import { row, rows, run, transaction } from "./db";
import { buildChatMemory, CHAT_WINDOWS, type ChatMessage } from "./chat-memory";
export class ChatError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
async function migratePreviousChat(user: string) {
  if (
    !(await row(
      "SELECT id FROM tutor_messages WHERE user_id=? AND chat_id IS NULL LIMIT 1",
      user,
    ))
  )
    return;
  await transaction(async () => {
    const previous = await rows(
      "SELECT * FROM tutor_messages WHERE user_id=? AND chat_id IS NULL ORDER BY created_at,rowid",
      user,
    );
    if (!previous.length) return;
    const id = randomUUID(),
      now = new Date().toISOString();
    await run(
      "INSERT INTO tutor_chats(id,user_id,title,created_at,updated_at) VALUES (?,?,?,?,?)",
      id,
      user,
      "Previous conversation",
      previous[0].created_at || now,
      previous.at(-1)!.created_at || now,
    );
    await run(
      "UPDATE tutor_messages SET chat_id=? WHERE user_id=? AND chat_id IS NULL",
      id,
      user,
    );
  });
}
async function getChat(user: string, id: string) {
  const chat = await row(
    "SELECT * FROM tutor_chats WHERE id=? AND user_id=?",
    id,
    user,
  );
  if (!chat) throw new ChatError("Chat not found.", 404);
  return chat;
}
function publicChat(c: Record<string, any>): Record<string, any> {
  const { request_token, busy_until, ...rest } = c;
  return { ...rest, busy: !!busy_until && Date.parse(busy_until) > Date.now() };
}
export async function listTutorChats(user: string) {
  await migratePreviousChat(user);
  return (
    await rows(
      "SELECT c.*, (SELECT COUNT(*) FROM tutor_messages m WHERE m.chat_id=c.id AND m.user_id=c.user_id) AS message_count FROM tutor_chats c WHERE c.user_id=? ORDER BY c.updated_at DESC,c.rowid DESC",
      user,
    )
  ).map(publicChat);
}
export async function createTutorChat(user: string) {
  await migratePreviousChat(user);
  const id = randomUUID(),
    now = new Date().toISOString();
  await run(
    "INSERT INTO tutor_chats(id,user_id,title,created_at,updated_at) VALUES (?,?,?,?,?)",
    id,
    user,
    "New chat",
    now,
    now,
  );
  return publicChat(await getChat(user, id));
}
export async function readTutorChat(user: string, id: string) {
  const chat = await getChat(user, id);
  const messages = await rows(
    "SELECT id,role,body,created_at FROM tutor_messages WHERE user_id=? AND chat_id=? ORDER BY rowid",
    user,
    id,
  );
  const memory = buildChatMemory(
    messages.map((m) => ({ role: m.role, content: m.body })),
    chat.draft,
    chat.context_notes,
    chat.window_tokens,
  );
  return { chat: publicChat(chat), messages, memory: memory.summary };
}
export async function updateTutorChat(user: string, id: string, changes: any) {
  return await transaction(async () => {
    const chat = await getChat(user, id);
    if (chat.busy_until && Date.parse(chat.busy_until) > Date.now())
      throw new ChatError(
        "This chat is generating a reply. Wait for it to finish before editing.",
        409,
      );
    const next = { ...chat };
    if (changes.title !== undefined) {
      if (
        typeof changes.title !== "string" ||
        !changes.title.trim() ||
        changes.title.length > 80
      )
        throw new ChatError("Use a chat title of 1–80 characters.");
      next.title = changes.title.trim();
    }
    if (changes.contextNotes !== undefined) {
      if (
        typeof changes.contextNotes !== "string" ||
        changes.contextNotes.length > 2000
      )
        throw new ChatError("Pinned context must be under 2,000 characters.");
      next.context_notes = changes.contextNotes;
    }
    if (changes.draft !== undefined) {
      if (typeof changes.draft !== "string" || changes.draft.length > 10000)
        throw new ChatError("Draft must be under 10,000 characters.");
      next.draft = changes.draft;
    }
    if (changes.windowTokens !== undefined) {
      if (!CHAT_WINDOWS.includes(changes.windowTokens))
        throw new ChatError("Choose a 2k, 4k or 8k memory window.");
      next.window_tokens = changes.windowTokens;
    }
    buildChatMemory([], next.draft, next.context_notes, next.window_tokens);
    await run(
      "UPDATE tutor_chats SET title=?,context_notes=?,window_tokens=?,draft=?,updated_at=? WHERE id=? AND user_id=?",
      next.title,
      next.context_notes,
      next.window_tokens,
      next.draft,
      new Date().toISOString(),
      id,
      user,
    );
    return await readTutorChat(user, id);
  });
}
export async function prepareTutorTurn(
  user: string,
  id: string,
  input: string,
) {
  if (!input.trim() || input.length > 10000)
    throw new ChatError("Enter a message of 1–10,000 characters.");
  return await transaction(async () => {
    const chat = await getChat(user, id);
    if (chat.busy_until && Date.parse(chat.busy_until) > Date.now())
      throw new ChatError(
        "A reply is already being generated in this chat.",
        409,
      );
    const messages = await rows(
      "SELECT role,body FROM tutor_messages WHERE user_id=? AND chat_id=? ORDER BY rowid",
      user,
      id,
    );
    const memory = buildChatMemory(
      messages.map((m) => ({ role: m.role, content: m.body })),
      input,
      chat.context_notes,
      chat.window_tokens,
    );
    const token = randomUUID();
    await run(
      "UPDATE tutor_chats SET request_token=?,busy_until=?,draft=? WHERE id=? AND user_id=?",
      token,
      new Date(Date.now() + 90000).toISOString(),
      input,
      id,
      user,
    );
    return {
      chatId: id,
      token,
      input,
      history: memory.history,
      memory: memory.summary,
    };
  });
}
export async function finishTutorTurn(
  user: string,
  turn: Awaited<ReturnType<typeof prepareTutorTurn>>,
  answer: string,
) {
  await transaction(async () => {
    const chat = await getChat(user, turn.chatId);
    if (chat.request_token !== turn.token)
      throw new ChatError(
        "This reply expired. Please send your message again.",
        409,
      );
    const now = new Date().toISOString();
    for (const [role, body] of [
      ["user", turn.input],
      ["assistant", answer],
    ])
      await run(
        "INSERT INTO tutor_messages(id,user_id,chat_id,role,body,created_at) VALUES (?,?,?,?,?,?)",
        randomUUID(),
        user,
        turn.chatId,
        role,
        body,
        now,
      );
    const title =
      chat.title === "New chat"
        ? turn.input.replace(/\s+/g, " ").trim().slice(0, 60)
        : chat.title;
    await run(
      "UPDATE tutor_chats SET title=?,draft=?,request_token=NULL,busy_until=NULL,updated_at=? WHERE id=? AND user_id=?",
      title,
      chat.draft === turn.input ? "" : chat.draft,
      now,
      turn.chatId,
      user,
    );
  });
}
export async function releaseTutorTurn(
  user: string,
  turn: Awaited<ReturnType<typeof prepareTutorTurn>>,
) {
  await run(
    "UPDATE tutor_chats SET request_token=NULL,busy_until=NULL WHERE id=? AND user_id=? AND request_token=?",
    turn.chatId,
    user,
    turn.token,
  );
}
