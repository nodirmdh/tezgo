# Kungrad Delivery Platform — Поэтапный план работ (MVP)

## Этап 1. Admin Panel (первый приоритет)
1. Инициализация `admin/` на Next.js (PWA, mobile-first).
2. Базовый UI kit и страницы: Users, Clients, Partners, Outlets, Couriers, Orders, Finance.
3. Авторизация admin/support (stub по tg_id) + роли.
4. Фейковые данные и мок-API для быстрого тестирования.
5. Деплой на Vercel + `.env.example`.

## Этап 2. Документация и требования
1. `README.md` с целями, архитектурой и запуском.
2. `docs/requirements.md` — детализация ТЗ.
3. `docs/architecture.md` — схема модулей и потоков.
4. `docs/domains.md` — доменная модель и сущности.
5. `docs/PLANS.md` — расширенный roadmap.
6. `docs/status.md` — текущий статус реализации.

## Этап 3. Базовая структура проекта и БД
1. Монорепо:
   - `backend/` (Node.js + Express)
   - `miniapp/` (React + Vite)
   - `admin/` (Next.js PWA)
2. `.env.example` для каждой части.
3. SQLite + миграции (Users, Clients, Partners, Outlets, Couriers, Catalog Items, Orders, Reviews, Courier Locations).
4. Сиды для тестирования (admin/support, партнёр, филиал, курьер).

## Этап 4. API (заказы и базовые сущности)
1. CRUD Users/Partners/Outlets/Couriers/Orders.
2. Жизненный цикл заказа + pickup-код (hash, 3 попытки, блокировка).
3. SLA таймеры + штрафы.
4. Подготовка деплоя на Render.

## Этап 5. Client Mini App
1. Роутинг `/client`.
2. Каталог → корзина → оформление заказа.
3. Активный заказ + трекинг.
4. История заказов + отзывы.

## Этап 6. Restaurant Mini App
1. Роутинг `/restaurant`.
2. Принятие/отклонение, ETA, «Готов к выдаче».
3. Меню: CRUD товаров, стоп-лист.

## Этап 7. Courier Mini App
1. Роутинг `/courier`.
2. Доступные заказы + ввод pickup-кода.
3. Статусы «забрал» / «доставил», live tracking.

## Этап 8. Финализация MVP
1. Финансовая модель (ledger, выплаты, штрафы).
2. Промокоды.
3. OpenAPI документация.
4. Инструкции деплоя на Render/Vercel.

