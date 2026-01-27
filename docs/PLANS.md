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
- Отмена заказов: справочник причин, запись отмены, авто-эффекты через ledger, audit.
- Профиль клиента v2: CRM note, subscriptions, danger zone, audit/ledger, аккордеоны.
- Профиль блюда v2: стоплист, копирование, adult, КБЖУ, расширенные поля items/outlet_items.
- Кампании/сеты: CRUD, валидации, статусы, дублирование, заказы по кампании, audit.
- Order pricing/ledger: promo/campaign расчет, refunds/compensations, order_adjustments, audit.

## 4. Mini App
- Client → Restaurant → Courier.

## 5. Финализация
- Финансы, промокоды, OpenAPI, деплой.
