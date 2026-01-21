-- Extend orders/users for MVP flows

ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'client';

ALTER TABLE orders ADD COLUMN pickup_locked_until INTEGER;
ALTER TABLE orders ADD COLUMN sla_due_at INTEGER;
ALTER TABLE orders ADD COLUMN sla_breached INTEGER DEFAULT 0;
