CREATE TABLE tutor_chats (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, title TEXT NOT NULL, context_notes TEXT NOT NULL DEFAULT '', window_tokens INTEGER NOT NULL DEFAULT 4000, draft TEXT NOT NULL DEFAULT '', request_token TEXT, busy_until TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
CREATE INDEX tutor_chats_user ON tutor_chats(user_id,updated_at);
ALTER TABLE tutor_messages ADD COLUMN chat_id TEXT REFERENCES tutor_chats(id) ON DELETE CASCADE;
CREATE INDEX tutor_messages_chat ON tutor_messages(user_id,chat_id,created_at);
