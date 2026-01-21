CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL,
  actor_user_id INTEGER,
  before_json TEXT,
  after_json TEXT,
  reason TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO audit_logs (
  entity_type,
  entity_id,
  action,
  actor_user_id,
  before_json,
  after_json,
  reason,
  created_at
)
SELECT
  entity_type,
  entity_id,
  action,
  actor_user_id,
  before_json,
  after_json,
  NULL,
  created_at
FROM audit_log;

CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity_type, entity_id, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_logs(actor_user_id, created_at);

CREATE TABLE IF NOT EXISTS saved_views (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  scope TEXT NOT NULL,
  title TEXT NOT NULL,
  owner_user_id INTEGER,
  is_shared INTEGER DEFAULT 0,
  filters_json TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_saved_views_scope ON saved_views(scope);
CREATE INDEX IF NOT EXISTS idx_saved_views_owner ON saved_views(owner_user_id);
