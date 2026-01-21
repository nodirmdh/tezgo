-- Outlet contact details and status reason

ALTER TABLE outlets ADD COLUMN phone TEXT;
ALTER TABLE outlets ADD COLUMN email TEXT;
ALTER TABLE outlets ADD COLUMN address_comment TEXT;
ALTER TABLE outlets ADD COLUMN status_reason TEXT;
ALTER TABLE outlets ADD COLUMN status_updated_at TEXT;
