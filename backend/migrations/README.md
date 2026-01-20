# Миграции (SQLite)

Содержит SQL-схему для MVP. На раннем этапе можно применить вручную.

## Применение (локально)
1. Создайте файл базы: `sqlite3 data/app.db`.
2. Примените скрипт:
   ```bash
   sqlite3 data/app.db < migrations/001_init.sql
   ```
