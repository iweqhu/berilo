CREATE TABLE feedback (
  id TEXT PRIMARY KEY NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  section TEXT NOT NULL CHECK (section IN ('dela', 'teme')),
  entry_id INTEGER NOT NULL CHECK (entry_id >= 0),
  title TEXT NOT NULL,
  message TEXT NOT NULL CHECK (length(message) BETWEEN 5 AND 1500)
);

CREATE INDEX feedback_section_entry ON feedback (section, entry_id, created_at);
CREATE INDEX feedback_created ON feedback (created_at);
