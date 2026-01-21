# Требования (MVP)

## Роли
Client, Courier, Partner, Admin, Support, Operator, Read-only.

## Admin Panel
- Разделы: Users, Clients, Orders, Outlets.
- Карточки сущностей: Overview/Orders/Finance/Notes.
- Global Search: поиск по tgId/username, по имени/телефону клиента, по orderId.
- Клиенты: адреса (CRUD + primary) и выдача промокодов.
- Orders: список заказов, SLA и проблемные флаги.
- Outlets: карточка, меню и управление промо.
- UI компоненты: toast, confirm, skeleton.
- RBAC: ограничения по UI и API (403 для запрещённых действий).
- Bulk actions:
  - Массовое управление позициями меню (цены, availability, stock) с preview + confirm.
  - Массовое обновление скидок и удаление items в кампаниях.
  - Обязательное логирование массовых операций (кто/когда/что изменил).
- CSV bulk upload:
  - Загрузка CSV с обязательным preview перед применением.
  - Поддержка меню outlet и campaign items.
  - Применение изменений атомарно с логированием.
- Audit:
  - Централизованный журнал действий с фильтрами по сущности/актёру/дате.
  - История изменений по карточке сущности (users/clients/outlets/orders).
  - Причины изменения цен и массовых операций.
- Operational Dashboard:
  - KPI и проблемные заказы за выбранный период.
  - Топ outlets/couriers по задержкам и фильтры по проблемам.
  - Сохранённые представления (filters) для dashboard-видов.
