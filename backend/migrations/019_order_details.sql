-- Order details and items for admin view

ALTER TABLE orders ADD COLUMN delivery_address_comment TEXT;
ALTER TABLE orders ADD COLUMN address_entrance TEXT;
ALTER TABLE orders ADD COLUMN address_floor TEXT;
ALTER TABLE orders ADD COLUMN address_apartment TEXT;
ALTER TABLE orders ADD COLUMN comment_to_restaurant TEXT;
ALTER TABLE orders ADD COLUMN comment_to_address TEXT;
ALTER TABLE orders ADD COLUMN crm_comment TEXT;
ALTER TABLE orders ADD COLUMN receiver_name TEXT;
ALTER TABLE orders ADD COLUMN receiver_phone TEXT;
ALTER TABLE orders ADD COLUMN orderer_phone TEXT;
ALTER TABLE orders ADD COLUMN utensils_count INTEGER DEFAULT 0;
ALTER TABLE orders ADD COLUMN is_for_other INTEGER DEFAULT 0;
ALTER TABLE orders ADD COLUMN promised_delivery_at TEXT;
ALTER TABLE orders ADD COLUMN sent_to_restaurant_at TEXT;
ALTER TABLE orders ADD COLUMN discount_amount INTEGER DEFAULT 0;
ALTER TABLE orders ADD COLUMN promo_code TEXT;

CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  photo_url TEXT,
  sku TEXT,
  weight_grams INTEGER DEFAULT 0,
  unit_price INTEGER DEFAULT 0,
  quantity INTEGER DEFAULT 1,
  total_price INTEGER DEFAULT 0,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
