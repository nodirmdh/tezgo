# Требования (MVP)

## Роли
Client, Courier, Partner, Admin, Support, Operator, Read-only.

## Admin Panel
- Список и управление Users/Clients/Orders/Outlets.
- Профиль сущности и вкладки (Overview/Orders/etc.).
- Global Search: поиск по tgId/username, имени/телефону клиента, orderId.
- Clients: адреса (CRUD + primary) и промокоды.
- Orders: проблемные статусы, SLA и комментарии к проблемам.
- Outlets: статус открыто/закрыто, меню и кампании.
- Общие UI-компоненты: toast, confirm, skeleton.
- RBAC: ограничения на UI и API (403 при отсутствии прав).
- Мультиязычный интерфейс Admin (ru/uz/kaa/en) и переключатель языка.

## Расширенные требования
- Детализированные требования к профилям пользователей, партнёров, точек, курьеров, заказов, промокодов и финансов см. `docs/tech-spec.md`.
