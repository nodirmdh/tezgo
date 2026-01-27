CREATE TABLE IF NOT EXISTS campaigns (
  id TEXT PRIMARY KEY,
  outlet_id INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('discount','bundle','bogo')),
  title TEXT NOT NULL,
  description TEXT,
  priority INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','paused','expired','archived')),
  start_at TEXT,
  end_at TEXT,
  active_days TEXT,
  active_hours TEXT,
  min_order_amount INTEGER NOT NULL DEFAULT 0,
  max_uses_total INTEGER NOT NULL DEFAULT 0,
  max_uses_per_client INTEGER NOT NULL DEFAULT 0,
  delivery_methods TEXT,
  stoplist_policy TEXT NOT NULL DEFAULT 'hide' CHECK (stoplist_policy IN ('hide','disable')),
  bundle_fixed_price INTEGER,
  bundle_percent_discount INTEGER,
  created_by_role TEXT,
  created_by_tg_id TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  archived_at TEXT,
  FOREIGN KEY (outlet_id) REFERENCES outlets(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_campaigns_outlet_status ON campaigns(outlet_id, status);
CREATE INDEX IF NOT EXISTS idx_campaigns_outlet_created ON campaigns(outlet_id, created_at);

CREATE TABLE IF NOT EXISTS campaign_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_id TEXT NOT NULL,
  outlet_id INTEGER NOT NULL,
  item_id INTEGER NOT NULL,
  qty INTEGER NOT NULL DEFAULT 1,
  required INTEGER NOT NULL DEFAULT 0,
  discount_type TEXT NOT NULL DEFAULT 'percent',
  discount_value INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
  FOREIGN KEY (outlet_id) REFERENCES outlets(id) ON DELETE CASCADE,
  FOREIGN KEY (item_id) REFERENCES items(id)
);

CREATE INDEX IF NOT EXISTS idx_campaign_items_campaign ON campaign_items(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_items_item ON campaign_items(item_id);

CREATE TABLE IF NOT EXISTS campaign_usage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_id TEXT NOT NULL,
  order_id INTEGER NOT NULL,
  client_user_id INTEGER,
  discount_amount INTEGER,
  applied_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id),
  FOREIGN KEY (order_id) REFERENCES orders(id)
);

CREATE INDEX IF NOT EXISTS idx_campaign_usage_campaign_order ON campaign_usage(campaign_id, order_id);
