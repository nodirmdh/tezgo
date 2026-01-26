# Миграции (SQLite)

SQL-миграции для MVP. Выполняются автоматически при запуске backend.

## Ручной запуск (если нужно)
```bash
sqlite3 data/app.db < migrations/001_init.sql
sqlite3 data/app.db < migrations/002_add_order_fields.sql
sqlite3 data/app.db < migrations/003_add_partner_manager.sql
sqlite3 data/app.db < migrations/004_promos_finance.sql
sqlite3 data/app.db < migrations/005_users_meta.sql
sqlite3 data/app.db < migrations/006_orders_extra.sql
sqlite3 data/app.db < migrations/007_user_logs.sql
sqlite3 data/app.db < migrations/008_finance_user.sql
sqlite3 data/app.db < migrations/009_client_notes.sql
sqlite3 data/app.db < migrations/010_order_events.sql
sqlite3 data/app.db < migrations/011_entity_notes.sql
sqlite3 data/app.db < migrations/012_add_status_and_courier_phone.sql
sqlite3 data/app.db < migrations/013_promos_extra.sql
sqlite3 data/app.db < migrations/014_audit_log.sql
sqlite3 data/app.db < migrations/015_client_addresses.sql
sqlite3 data/app.db < migrations/016_promo_issues.sql
sqlite3 data/app.db < migrations/029_order_cancellations.sql
```
