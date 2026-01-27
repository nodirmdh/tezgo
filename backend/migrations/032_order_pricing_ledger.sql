-- Order pricing breakdown + ledger metadata

ALTER TABLE orders ADD COLUMN promo_discount_amount INTEGER DEFAULT 0;
ALTER TABLE orders ADD COLUMN campaign_discount_amount INTEGER DEFAULT 0;
ALTER TABLE orders ADD COLUMN campaign_ids TEXT;

ALTER TABLE order_items ADD COLUMN item_id INTEGER;

CREATE TABLE IF NOT EXISTS order_adjustments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('refund','compensation','manual_discount')),
  amount INTEGER NOT NULL,
  reason_code TEXT,
  comment TEXT,
  created_by_role TEXT,
  created_by_tg_id TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

ALTER TABLE finance_ledger ADD COLUMN entity_type TEXT;
ALTER TABLE finance_ledger ADD COLUMN entity_id INTEGER;
ALTER TABLE finance_ledger ADD COLUMN currency TEXT DEFAULT 'UZS';
ALTER TABLE finance_ledger ADD COLUMN meta_json TEXT;
ALTER TABLE finance_ledger ADD COLUMN created_by_role TEXT;
ALTER TABLE finance_ledger ADD COLUMN created_by_tg_id TEXT;
