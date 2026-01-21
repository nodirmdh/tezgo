CREATE TABLE IF NOT EXISTS client_addresses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_user_id INTEGER NOT NULL,
  label TEXT,
  address_text TEXT NOT NULL,
  entrance TEXT,
  floor TEXT,
  apartment TEXT,
  comment TEXT,
  lat REAL,
  lng REAL,
  is_primary INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_user_id) REFERENCES clients(user_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_client_addresses_client_user_id ON client_addresses(client_user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_client_addresses_primary ON client_addresses(client_user_id) WHERE is_primary = 1;
