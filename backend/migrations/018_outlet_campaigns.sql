CREATE TABLE IF NOT EXISTS outlet_campaigns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  outlet_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  status TEXT DEFAULT 'planned',
  start_at TEXT,
  end_at TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (outlet_id) REFERENCES outlets(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by_user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS outlet_campaign_items (
  campaign_id INTEGER NOT NULL,
  item_id INTEGER NOT NULL,
  discount_type TEXT NOT NULL,
  discount_value INTEGER NOT NULL,
  PRIMARY KEY (campaign_id, item_id),
  FOREIGN KEY (campaign_id) REFERENCES outlet_campaigns(id) ON DELETE CASCADE,
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_campaign_items_campaign ON outlet_campaign_items(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_items_item ON outlet_campaign_items(item_id);
