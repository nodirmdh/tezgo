CREATE TABLE IF NOT EXISTS promo_issues (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_user_id INTEGER NOT NULL,
  code TEXT NOT NULL,
  type TEXT NOT NULL,
  value INTEGER NOT NULL,
  min_order_amount INTEGER,
  status TEXT DEFAULT 'active',
  reason TEXT NOT NULL,
  issued_by_user_id INTEGER NOT NULL,
  related_order_id INTEGER,
  issued_at TEXT DEFAULT CURRENT_TIMESTAMP,
  expires_at TEXT,
  used_at TEXT,
  revoked_at TEXT,
  revoked_by_user_id INTEGER,
  FOREIGN KEY (client_user_id) REFERENCES clients(user_id) ON DELETE CASCADE,
  FOREIGN KEY (issued_by_user_id) REFERENCES users(id),
  FOREIGN KEY (related_order_id) REFERENCES orders(id),
  FOREIGN KEY (revoked_by_user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_promo_issues_client_user_id ON promo_issues(client_user_id);
CREATE INDEX IF NOT EXISTS idx_promo_issues_status ON promo_issues(status);
CREATE INDEX IF NOT EXISTS idx_promo_issues_code ON promo_issues(code);
