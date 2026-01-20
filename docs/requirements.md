# Требования (MVP)

Документ фиксирует ключевые требования из ТЗ.

## Основные компоненты
- 3 Telegram-бота с Mini App: client, restaurant, courier.
- Общий backend API.
- Единая БД (SQLite → PostgreSQL).
- Веб-админка только для admin/support.

## Роли
Client, Courier, Partner, Restaurant/Shop staff, Admin, Support/Operator.

## Ключевая логика заказов
1. Принят системой → принят рестораном → готов → забрал → доставил.
2. Pickup-код 3 цифры, хранится в хэше, 3 попытки ввода.
3. SLA: готовка по ETA и доставка 20 минут.

## Финансы
- Service fee 5000 сум.
- Комиссия 7% от subtotal.
- Штрафы: ресторан 10%, курьер 20%.
