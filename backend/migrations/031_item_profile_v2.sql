-- Item profile v2 fields

ALTER TABLE items ADD COLUMN short_title TEXT;
ALTER TABLE items ADD COLUMN priority INTEGER DEFAULT 0;
ALTER TABLE items ADD COLUMN categories TEXT;
ALTER TABLE items ADD COLUMN image_url TEXT;
ALTER TABLE items ADD COLUMN image_enabled INTEGER DEFAULT 1;
ALTER TABLE items ADD COLUMN is_adult INTEGER DEFAULT 0;
ALTER TABLE items ADD COLUMN kcal INTEGER;
ALTER TABLE items ADD COLUMN protein REAL;
ALTER TABLE items ADD COLUMN fat REAL;
ALTER TABLE items ADD COLUMN carbs REAL;
ALTER TABLE items ADD COLUMN core_id TEXT;
ALTER TABLE items ADD COLUMN origin_id TEXT;

ALTER TABLE outlet_items ADD COLUMN stock_qty INTEGER;
ALTER TABLE outlet_items ADD COLUMN is_visible INTEGER DEFAULT 1;
ALTER TABLE outlet_items ADD COLUMN stoplist_active INTEGER DEFAULT 0;
ALTER TABLE outlet_items ADD COLUMN stoplist_until TEXT;
ALTER TABLE outlet_items ADD COLUMN stoplist_reason TEXT;
ALTER TABLE outlet_items ADD COLUMN delivery_methods TEXT;

UPDATE outlet_items
SET stock_qty = stock
WHERE stock_qty IS NULL;

UPDATE outlet_items
SET stoplist_active = CASE WHEN is_available = 0 THEN 1 ELSE stoplist_active END,
    stoplist_reason = COALESCE(stoplist_reason, unavailable_reason),
    stoplist_until = COALESCE(stoplist_until, unavailable_until)
WHERE stoplist_active = 0;

UPDATE items
SET image_url = COALESCE(image_url, photo_url)
WHERE image_url IS NULL;
