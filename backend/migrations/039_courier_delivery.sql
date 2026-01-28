-- Courier delivery flow fields

ALTER TABLE orders ADD COLUMN courier_assigned_at TEXT;
ALTER TABLE orders ADD COLUMN courier_picked_up_at TEXT;
ALTER TABLE orders ADD COLUMN courier_delivered_at TEXT;
ALTER TABLE orders ADD COLUMN delivery_status TEXT;
ALTER TABLE orders ADD COLUMN delivery_fee INTEGER DEFAULT 0;
ALTER TABLE orders ADD COLUMN delivery_provider TEXT DEFAULT 'courier';
ALTER TABLE orders ADD COLUMN cancel_source TEXT;
ALTER TABLE orders ADD COLUMN cancel_reason TEXT;
ALTER TABLE orders ADD COLUMN penalty_amount INTEGER DEFAULT 0;
