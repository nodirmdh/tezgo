-- Partners requisites and partner users/points

ALTER TABLE partners ADD COLUMN display_name TEXT;
ALTER TABLE partners ADD COLUMN legal_name TEXT;
ALTER TABLE partners ADD COLUMN inn TEXT;
ALTER TABLE partners ADD COLUMN legal_type TEXT DEFAULT 'other';
ALTER TABLE partners ADD COLUMN director_full_name TEXT;
ALTER TABLE partners ADD COLUMN legal_address TEXT;
ALTER TABLE partners ADD COLUMN bank_account TEXT;
ALTER TABLE partners ADD COLUMN bank_name TEXT;
ALTER TABLE partners ADD COLUMN bank_mfo TEXT;
ALTER TABLE partners ADD COLUMN verification_status TEXT DEFAULT 'draft';
ALTER TABLE partners ADD COLUMN verification_comment TEXT;
ALTER TABLE partners ADD COLUMN payout_hold INTEGER DEFAULT 0;
ALTER TABLE partners ADD COLUMN commission_percent REAL DEFAULT 0;
ALTER TABLE partners ADD COLUMN created_at TEXT DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE partners ADD COLUMN updated_at TEXT;

CREATE TABLE IF NOT EXISTS partner_users (
  user_id INTEGER NOT NULL,
  partner_id INTEGER NOT NULL,
  role_in_partner TEXT DEFAULT 'owner',
  PRIMARY KEY (user_id, partner_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS points (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  partner_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  address_comment TEXT,
  phone TEXT,
  work_hours TEXT,
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT,
  FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE CASCADE
);

-- Orders: handoff code + fulfillment + commission snapshot
ALTER TABLE orders ADD COLUMN handoff_code_hash TEXT;
ALTER TABLE orders ADD COLUMN handoff_code_encrypted TEXT;
ALTER TABLE orders ADD COLUMN handoff_code_last4 TEXT;
ALTER TABLE orders ADD COLUMN handoff_code_expires_at TEXT;
ALTER TABLE orders ADD COLUMN handoff_code_used_at TEXT;
ALTER TABLE orders ADD COLUMN fulfillment_type TEXT DEFAULT 'delivery';
ALTER TABLE orders ADD COLUMN food_total INTEGER DEFAULT 0;
ALTER TABLE orders ADD COLUMN commission_from_food INTEGER DEFAULT 0;
ALTER TABLE orders ADD COLUMN partner_net INTEGER DEFAULT 0;
