# Расширенный roadmap

## 1. Admin Panel (приоритет)
- Базовые страницы: Users, Clients, Partners, Outlets, Couriers, Orders, Finance.
- Авторизация admin/support по tg_id.
- Мок-данные и ранние тесты UX.

## 2. Документация
- Актуализация требований, архитектуры, доменов.
- Фиксация статуса в `docs/status.md`.

## 3. Бэкенд и БД
- Миграции, сиды.
- CRUD для админки.
- Заказы и статусы, pickup-коды, SLA.
- Партнёры: реквизиты, верификация, payout hold, комиссия, points, partner_users.
- Handoff код заказа: генерация, хранение hash/encrypted, confirm-handoff.
- Отмена заказов: справочник причин, запись отмены, авто-эффекты через ledger, audit.
- Профиль клиента v2: CRM note, subscriptions, danger zone, audit/ledger, аккордеоны.
- Профиль блюда v2: стоплист, копирование, adult, КБЖУ, расширенные поля items/outlet_items.
- Кампании/сеты: CRUD, валидации, статусы, дублирование, заказы по кампании, audit.
- Order pricing/ledger: promo/campaign расчет, refunds/compensations, order_adjustments, audit.
- Меню точек партнёра: категории/позиции (menu_categories/menu_items), анти-дубли, CRUD, доступность.

## 4. Mini App
- Client → Restaurant → Courier.
- Restaurant: управление меню по точкам (категории/позиции).

## 4. Admin
- Меню точек партнёра: просмотр и правки позиций (цена/доступность/категория).

## 5. Финализация
- Финансы, промокоды, OpenAPI, деплой.
