-- Extra order fields for admin view

ALTER TABLE orders ADD COLUMN total_amount INTEGER DEFAULT 0;
ALTER TABLE orders ADD COLUMN delivery_address TEXT;
