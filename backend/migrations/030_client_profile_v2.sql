-- Client profile v2: CRM note, subscriptions, sensitive actions

CREATE TABLE IF NOT EXISTS client_crm_notes (
  id TEXT PRIMARY KEY,
  client_user_id INTEGER NOT NULL,
  note TEXT NOT NULL,
  updated_by_role TEXT,
  updated_by_tg_id TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_user_id) REFERENCES clients(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS client_subscriptions (
  client_user_id INTEGER PRIMARY KEY,
  email_opt_in INTEGER NOT NULL DEFAULT 0,
  push_opt_in INTEGER NOT NULL DEFAULT 0,
  sms_opt_in INTEGER NOT NULL DEFAULT 0,
  food_email INTEGER NOT NULL DEFAULT 0,
  food_push INTEGER NOT NULL DEFAULT 0,
  food_sms INTEGER NOT NULL DEFAULT 0,
  market_email INTEGER NOT NULL DEFAULT 0,
  market_push INTEGER NOT NULL DEFAULT 0,
  market_sms INTEGER NOT NULL DEFAULT 0,
  taxi_email INTEGER NOT NULL DEFAULT 0,
  taxi_push INTEGER NOT NULL DEFAULT 0,
  taxi_sms INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_by_role TEXT,
  updated_by_tg_id TEXT,
  FOREIGN KEY (client_user_id) REFERENCES clients(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS client_sensitive_actions (
  id TEXT PRIMARY KEY,
  client_user_id INTEGER NOT NULL,
  action_type TEXT NOT NULL,
  reason TEXT NOT NULL,
  created_by_role TEXT,
  created_by_tg_id TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_user_id) REFERENCES clients(user_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_client_sensitive_actions_client ON client_sensitive_actions(client_user_id);
