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
- Отмена заказа использует `GET /api/cancel-reasons` (справочник причин) и `POST /api/orders/:id/cancel`, сохраняет `order_cancellations`, пишет `order_events`, audit log и финансовые эффекты через `finance_ledger`.
- Пересчет заказа использует `computeOrderPricing` на backend: subtotal/fees/promo/campaigns, записывает `promo_discount_amount` и `campaign_discount_amount`, обновляет `campaign_usage`.
- Финансовые эффекты (refund/compensation/penalty) пишутся только через `finance_ledger`, связанный с `order_adjustments`.
- Таймлайн заказа строится из `order_events` и SLA-расчетов (`computeOrderSignals`) для минут готовки/доставки и этапов.
- Глобальные промоакции используют `promo_outlets` для выбора нескольких точек; API `/api/promos` принимает `outlet_ids`.
- Профиль партнера использует `GET /api/partners/:id/finance` для финансовой сводки и транзакций.
- Профиль точки использует расширенные поля `outlets` (контакты, комментарий к адресу, причина статуса).
- Позиции меню: `GET/POST/PATCH/DELETE /api/outlets/:outletId/items`, профиль позиции `GET /api/outlets/:outletId/items/:itemId`, стоплист `PATCH /api/outlets/:outletId/items/:itemId/stoplist`, копирование/дублирование `POST /api/outlets/:outletId/items/:itemId/duplicate` и `POST /api/outlets/:outletId/items/:itemId/copy-to-outlet`.
- Данные позиции делятся на `items` (контент, медиа, КБЖУ, флаги) и `outlet_items` (цены, доступность, stoplist, delivery_methods), история цен хранится в `outlet_item_price_history`.
- Кампании/сеты: CRUD `/api/outlets/:outletId/campaigns`, профиль `/api/campaigns/:id`, `activate/pause/archive/duplicate`, проверка `/api/campaigns/:id/validate`, заказы по кампании `/api/campaigns/:id/orders`. Данные хранятся в `campaigns`, `campaign_items`, `campaign_usage`, все изменения пишутся в audit log.
- Профиль курьера: данные из `couriers` (full_name, phone, address, delivery_methods, rating_avg/count) + статус из `users` через `PATCH /api/couriers/:id` и `/api/couriers/:id/status`.
- Профиль клиента v2 использует `GET /api/clients/:id` (crm_note + subscriptions), `PATCH /crm-note`, `PATCH /subscriptions`, `POST /actions`, `GET /compensations`, `GET /messages`, `GET /audit`.
- Профиль партнёра v2: `GET/PUT /partner/me`, `POST /partner/me/submit` (только partner), верификация и комиссия через `/admin/partners/*`.
- Точки партнёра: `GET/POST/PUT /partner/points` и admin CRUD `/admin/points`.
- Код передачи заказа (handoff): генерируется при создании заказа, хранится как hash + encrypted, подтверждение через `POST /api/orders/:id/confirm-handoff`.
- Меню точек партнёра: `GET/POST/PUT/DELETE /partner/points/:pointId/categories` и `GET/POST/PUT/PATCH/DELETE /partner/points/:pointId/items`.
- Admin меню точек: `GET /admin/points/:pointId/categories`, `GET/PUT /admin/points/:pointId/items`, `PATCH /admin/points/:pointId/items/:id/availability`.
- Partner Orders: `GET /partner/orders`, `GET /partner/orders/:id`, `POST /partner/orders/:id/accept`, `POST /partner/orders/:id/reject`, `POST /partner/orders/:id/ready`, `POST /partner/orders/:id/confirm-handoff`.
- Courier Orders: `GET /courier/orders/assigned`, `GET /courier/orders/available` (marketplace), `POST /courier/orders/:id/picked-up`, `POST /courier/orders/:id/in-transit`, `POST /courier/orders/:id/delivered`.
- Admin Operational: `GET /admin/dashboard/summary`, `GET /admin/orders`, `GET /admin/orders/:id`, `GET /admin/orders/:id/audit`, `POST /admin/orders/:id/assign-courier`, `POST /admin/orders/:id/cancel`, `GET /admin/problem-flags`, `PATCH /admin/problem-flags/:id/resolve`.
- Отчеты: `GET /admin/partners/payout-report`, `GET /admin/partners/payout-report/export`, `GET /admin/orders/export`, `GET /admin/couriers/leaderboard`.

## Инфраструктура
- Docker для backend/admin/miniapps, Nginx reverse proxy.
- HTTPS через Let’s Encrypt, HSTS в prod.
- /health для проверки backend.
- Логи с request_id и мониторинг Sentry.
