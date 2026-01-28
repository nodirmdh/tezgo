-- Partner order fields for operational flow

ALTER TABLE orders ADD COLUMN pickup_time TEXT;
ALTER TABLE orders ADD COLUMN napkins_count INTEGER DEFAULT 0;
ALTER TABLE orders ADD COLUMN customer_comment TEXT;
ALTER TABLE orders ADD COLUMN partner_comment TEXT;
ALTER TABLE orders ADD COLUMN reject_reason TEXT;
ALTER TABLE orders ADD COLUMN handed_over_at TEXT;
ALTER TABLE orders ADD COLUMN closed_at TEXT;
ALTER TABLE orders ADD COLUMN commission_percent_snapshot REAL;
