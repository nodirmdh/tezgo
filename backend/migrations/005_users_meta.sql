-- Add user meta fields

ALTER TABLE users ADD COLUMN updated_at TEXT;
ALTER TABLE users ADD COLUMN last_active TEXT;

UPDATE users
SET updated_at = CURRENT_TIMESTAMP,
    last_active = CURRENT_TIMESTAMP
WHERE updated_at IS NULL OR last_active IS NULL;
