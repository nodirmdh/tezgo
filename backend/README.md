# Backend API (Express)

## Запуск
```bash
npm install
npm run dev
```

## Переменные окружения
Смотрите `.env.example`.

## Проверка
- `GET /health` возвращает `{ "status": "ok" }`.

## MVP мок-эндпоинты
- `GET /api/users`, `POST /api/users`
- `GET /api/partners`, `POST /api/partners`
- `GET /api/outlets`, `POST /api/outlets`
- `GET /api/couriers`, `POST /api/couriers`
- `GET /api/orders`, `POST /api/orders`
- `GET /api/orders/:id`, `PATCH /api/orders/:id`
- `POST /api/orders/:id/accept` (prep_eta_minutes, выдаёт pickup_code)
- `POST /api/orders/:id/ready`
- `POST /api/orders/:id/pickup` (code)
- `POST /api/orders/:id/deliver`
