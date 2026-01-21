-- Stop-list details for outlet items

ALTER TABLE outlet_items ADD COLUMN unavailable_reason TEXT;
ALTER TABLE outlet_items ADD COLUMN unavailable_until TEXT;
