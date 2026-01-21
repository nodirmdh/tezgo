-- Partner contact details

ALTER TABLE partners ADD COLUMN contact_name TEXT;
ALTER TABLE partners ADD COLUMN phone_primary TEXT;
ALTER TABLE partners ADD COLUMN phone_secondary TEXT;
ALTER TABLE partners ADD COLUMN phone_tertiary TEXT;
ALTER TABLE partners ADD COLUMN email TEXT;
