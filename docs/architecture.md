# Архитектура

## Компоненты
- Backend API (Node.js + Express)
- БД (SQLite на MVP)
- Telegram Bots (Telegraf)
- Mini App (React + Vite)
- Admin Panel (Next.js PWA)

## Потоки
- Mini App и боты общаются с API по HTTP.
- Только API взаимодействует с БД.
- Админка использует мок-API слой на раннем этапе для UI/UX тестирования.

## Деплой
- Backend: Render.
- Mini App + Admin: Vercel.
- Админка разворачивается с корнем `admin/`.
