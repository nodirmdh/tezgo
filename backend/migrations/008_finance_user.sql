-- Finance ledger user bindings

ALTER TABLE finance_ledger ADD COLUMN user_id INTEGER;
ALTER TABLE finance_ledger ADD COLUMN order_id INTEGER;
ALTER TABLE finance_ledger ADD COLUMN balance_delta INTEGER DEFAULT 0;
ALTER TABLE finance_ledger ADD COLUMN category TEXT;
