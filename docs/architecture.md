# Архитектура

## Сервисы
- Backend API: Node.js + Express, SQLite.
- Admin Panel: Next.js (PWA).
- Mini App: React + Vite.
- Telegram Bots: Telegraf.

## Взаимодействие
- Admin работает через backend API (URL из `NEXT_PUBLIC_API_BASE_URL`).
- RBAC передаётся в заголовках `x-role` и `x-actor-tg`.

## Admin особенности
- Global Search в хедере использует endpoint `GET /api/search` и показывает результаты Users/Clients/Orders.
- Ошибки 401/403/500 обрабатываются централизованно в клиентском API‑слое.
