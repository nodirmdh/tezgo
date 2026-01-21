CREATE TABLE IF NOT EXISTS items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  sku TEXT,
  category TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS outlet_items (
  outlet_id INTEGER NOT NULL,
  item_id INTEGER NOT NULL,
  base_price INTEGER NOT NULL,
  is_available INTEGER DEFAULT 1,
  stock INTEGER,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (outlet_id, item_id),
  FOREIGN KEY (outlet_id) REFERENCES outlets(id) ON DELETE CASCADE,
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_outlet_items_outlet_id ON outlet_items(outlet_id);
CREATE INDEX IF NOT EXISTS idx_outlet_items_item_id ON outlet_items(item_id);
CREATE INDEX IF NOT EXISTS idx_outlet_items_available ON outlet_items(is_available);

CREATE TABLE IF NOT EXISTS outlet_item_price_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  outlet_id INTEGER NOT NULL,
  item_id INTEGER NOT NULL,
  old_price INTEGER NOT NULL,
  new_price INTEGER NOT NULL,
  changed_by_user_id INTEGER,
  reason TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (outlet_id) REFERENCES outlets(id) ON DELETE CASCADE,
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
  FOREIGN KEY (changed_by_user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_price_history_outlet_item ON outlet_item_price_history(outlet_id, item_id);
