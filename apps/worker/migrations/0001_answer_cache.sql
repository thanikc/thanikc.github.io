CREATE TABLE answer_cache (
  key        TEXT PRIMARY KEY,
  epoch      TEXT NOT NULL,
  locale     TEXT NOT NULL,
  question   TEXT NOT NULL,
  answer     TEXT NOT NULL,
  provider   TEXT NOT NULL,
  sources    TEXT NOT NULL,
  embedding  TEXT,
  created_at INTEGER NOT NULL
);

CREATE INDEX answer_cache_scan ON answer_cache (epoch, locale, created_at);
