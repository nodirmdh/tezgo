-- Points menu categories and items

CREATE TABLE IF NOT EXISTS menu_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  point_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  name_normalized TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT,
  UNIQUE(point_id, name_normalized),
  FOREIGN KEY (point_id) REFERENCES points(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS menu_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  point_id INTEGER NOT NULL,
  category_id INTEGER,
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL,
  is_available INTEGER DEFAULT 1,
  photo_url TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT,
  FOREIGN KEY (point_id) REFERENCES points(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES menu_categories(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_menu_categories_point ON menu_categories(point_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_menu_items_point ON menu_items(point_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category_id);
