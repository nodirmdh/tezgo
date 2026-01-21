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
- Ошибки 401/403/500 обрабатываются централизованно в клиентском API-слое.
- Локализация хранится в `admin/lib/i18n.js`, выбор языка сохраняется в cookie `admin_locale` и `localStorage`, сервер читает cookie через `admin/lib/i18n.server.js`.
- Детальная страница заказа использует `GET /api/orders/:id/details` и данные из `orders` и `order_items`.
- Обзор заказа использует `POST /api/orders/:id/items` для редактирования корзины с обязательным комментарием, а также `POST /api/orders/:id/notify` и `POST /api/orders/:id/resend` для действий поддержки.
- Таймлайн заказа строится из `order_events` и SLA-расчетов (`computeOrderSignals`) для минут готовки/доставки и этапов.
- Глобальные промоакции используют `promo_outlets` для выбора нескольких точек; API `/api/promos` принимает `outlet_ids`.
- Профиль партнера использует `GET /api/partners/:id/finance` для финансовой сводки и транзакций.
- Профиль точки использует расширенные поля `outlets` (контакты, комментарий к адресу, причина статуса).
- ???? ?????: `GET/POST/PATCH/DELETE /api/outlets/:outletId/items`, ?????? ??????? ? `items` (description, photo_url, weight_grams) ? ????-???? ? `outlet_items` (unavailable_reason, unavailable_until), ??????? ??? `price-history`.
- ???????? ?????: ????? ?????????? ???????, ??????????? ? ??? (bundle_name), ?????? ? ?????? ????? ??????????? ????? admin UI ? `/api/outlets/:outletId/campaigns` + `/items`.
- ??????? ???????: ?????? ?? `couriers` (full_name, phone, address, delivery_methods, rating_avg/count) ? ?????? `users` ????? `PATCH /api/couriers/:id` ? `/api/couriers/:id/status`.
