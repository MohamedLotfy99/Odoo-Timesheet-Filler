CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  db TEXT NOT NULL,
  username TEXT NOT NULL,
  uid INTEGER NOT NULL,
  encrypted_secret TEXT NOT NULL,
  odoo_url TEXT NOT NULL,
  employee_id INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS user_settings (
  db TEXT NOT NULL,
  username TEXT NOT NULL,
  encrypted_gemini_api_key TEXT NOT NULL DEFAULT '',
  provider TEXT NOT NULL DEFAULT 'gemini',
  gemini_model TEXT NOT NULL DEFAULT 'gemini-3.6-flash',
  prompt_template TEXT NOT NULL DEFAULT '',
  theme TEXT NOT NULL DEFAULT 'system',
  PRIMARY KEY (db, username)
);

CREATE TABLE IF NOT EXISTS history (
  id TEXT PRIMARY KEY,
  db TEXT NOT NULL,
  username TEXT NOT NULL,
  odoo_record_id INTEGER NOT NULL,
  task_url TEXT NOT NULL,
  task_name TEXT NOT NULL,
  description TEXT NOT NULL,
  duration TEXT NOT NULL,
  date TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  missing_in_odoo BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS history_db_username_idx ON history (db, username);
