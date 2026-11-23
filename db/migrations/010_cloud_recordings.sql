CREATE TABLE recording_chunks (
  recording_id TEXT NOT NULL REFERENCES recordings(id) ON DELETE CASCADE,
  part INTEGER NOT NULL,
  body TEXT NOT NULL,
  PRIMARY KEY (recording_id, part)
);
