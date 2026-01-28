-- Problem flags + handoff attempts + audit log columns

ALTER TABLE orders ADD COLUMN handoff_failed_attempts INTEGER DEFAULT 0;

CREATE TABLE IF NOT EXISTS problem_flags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  severity TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  resolved_at TEXT,
  resolved_by INTEGER,
  meta_json TEXT,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_problem_flags_order ON problem_flags(order_id);
CREATE INDEX IF NOT EXISTS idx_problem_flags_type ON problem_flags(type);
CREATE INDEX IF NOT EXISTS idx_problem_flags_severity ON problem_flags(severity);
CREATE INDEX IF NOT EXISTS idx_problem_flags_resolved ON problem_flags(resolved_at);

ALTER TABLE audit_log ADD COLUMN actor_role TEXT;
ALTER TABLE audit_log ADD COLUMN request_id TEXT;
