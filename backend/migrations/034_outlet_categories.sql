CREATE TABLE IF NOT EXISTS outlet_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  outlet_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (outlet_id) REFERENCES outlets(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_outlet_categories_unique
  ON outlet_categories(outlet_id, normalized_name);

CREATE INDEX IF NOT EXISTS idx_outlet_categories_outlet
  ON outlet_categories(outlet_id);

ALTER TABLE outlet_items ADD COLUMN category_id INTEGER;

INSERT INTO outlet_categories (outlet_id, name, normalized_name)
SELECT outlet_items.outlet_id,
       TRIM(items.category) as name,
       LOWER(TRIM(items.category)) as normalized_name
FROM outlet_items
JOIN items ON items.id = outlet_items.item_id
WHERE items.category IS NOT NULL AND TRIM(items.category) <> ''
GROUP BY outlet_items.outlet_id, LOWER(TRIM(items.category));

UPDATE outlet_items
SET category_id = (
  SELECT outlet_categories.id
  FROM outlet_categories
  WHERE outlet_categories.outlet_id = outlet_items.outlet_id
    AND outlet_categories.normalized_name = LOWER(TRIM((SELECT items.category FROM items WHERE items.id = outlet_items.item_id)))
)
WHERE category_id IS NULL
  AND (SELECT items.category FROM items WHERE items.id = outlet_items.item_id) IS NOT NULL
  AND TRIM((SELECT items.category FROM items WHERE items.id = outlet_items.item_id)) <> '';
