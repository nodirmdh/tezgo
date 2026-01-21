ALTER TABLE promo_codes ADD COLUMN starts_at TEXT;
ALTER TABLE promo_codes ADD COLUMN ends_at TEXT;
ALTER TABLE promo_codes ADD COLUMN min_order_amount INTEGER;
ALTER TABLE promo_codes ADD COLUMN outlet_id INTEGER;
ALTER TABLE promo_codes ADD COLUMN first_order_only INTEGER;
