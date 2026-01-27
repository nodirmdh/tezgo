# Backend API (Express)

## Запуск
```bash
npm install
npm run dev
```

## Переменные окружения
Смотрите `.env.example`.

## База данных
- SQLite файл по умолчанию: `backend/data/app.db`
- Миграции применяются автоматически при запуске.
- Сиды добавляются только при `SEED_DATA=true` (users/partners/outlets/couriers/orders).

## Проверка
- `GET /health` возвращает `{ "status": "ok" }`.

## MVP мок-эндпоинты
- `GET /api/users`, `POST /api/users`, `PATCH /api/users/:id`, `DELETE /api/users/:id`
- `GET /api/partners`, `POST /api/partners`, `PATCH /api/partners/:id`, `DELETE /api/partners/:id`
- `GET /api/outlets`, `POST /api/outlets`, `PATCH /api/outlets/:id`, `DELETE /api/outlets/:id`
- `GET /api/couriers`, `POST /api/couriers`, `PATCH /api/couriers/:id`, `DELETE /api/couriers/:id`
- `GET /api/orders`, `POST /api/orders`, `GET /api/orders/:id`, `PATCH /api/orders/:id`, `DELETE /api/orders/:id`
- `POST /api/orders/:id/accept` (prep_eta_minutes, выдаёт pickup_code)
- `POST /api/orders/:id/ready`
- `POST /api/orders/:id/pickup` (code)
- `POST /api/orders/:id/deliver`
- `GET /api/users/:id`, `GET /api/users/:id/orders`, `GET /api/users/:id/finance`, `GET /api/users/:id/activity`, `GET /api/users/:id/audit`
- `GET /api/promos`, `POST /api/promos`, `PATCH /api/promos/:id`, `DELETE /api/promos/:id`
- `GET /api/finance/summary`, `GET /api/finance/ledger`, `POST /api/finance/ledger`, `PATCH /api/finance/ledger/:id`, `DELETE /api/finance/ledger/:id`
