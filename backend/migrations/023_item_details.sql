-- Item details (description, photo, weight)

ALTER TABLE items ADD COLUMN description TEXT;
ALTER TABLE items ADD COLUMN photo_url TEXT;
ALTER TABLE items ADD COLUMN weight_grams INTEGER DEFAULT 0;
