CREATE TABLE login_accounts (username TEXT PRIMARY KEY, user_id TEXT REFERENCES users(id) ON DELETE SET NULL);
CREATE TABLE login_sessions (token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires_at TEXT NOT NULL);
CREATE INDEX login_sessions_user ON login_sessions(user_id,expires_at);
