# Деплой и эксплуатация

## Структура окружений
Есть два окружения: staging (публичный тест) и prod.  
Домены (пример):
- api.nodgo.uz → backend
- admin.nodgo.uz → admin (Next PWA)
- client.nodgo.uz → client miniapp
- partner.nodgo.uz → partner miniapp
- courier.nodgo.uz → courier miniapp

## Docker + Nginx
Файлы:
- `backend/Dockerfile`
- `admin/Dockerfile`
- `miniapp/Dockerfile.client`
- `miniapp/Dockerfile.partner`
- `miniapp/Dockerfile.courier`
- `deploy/docker-compose.staging.yml`
- `deploy/nginx.staging.conf`
- `deploy/nginx.prod.conf`

### Staging (docker-compose)
1) Скопировать env:
```
cp deploy/env.backend.staging.example deploy/env.backend.staging
cp deploy/env.admin.staging.example deploy/env.admin.staging
cp deploy/env.miniapp.staging.example deploy/env.miniapp.staging
```
2) Заполнить значения в `deploy/env.*.staging`.
3) Запуск:
```
docker compose -f deploy/docker-compose.staging.yml up -d --build
```

### Prod (Nginx + HTTPS)
1) Получить сертификаты Let’s Encrypt (certbot).
2) Использовать `deploy/nginx.prod.conf`.
3) Убедиться, что backend запущен с `TRUST_PROXY=true`.

## Миграции
SQLite миграции применяются автоматически при старте backend (`backend/src/db.js`).  
Перед релизом проверить, что новые `.sql` есть в `backend/migrations/`.

## Auth cookies (Telegram WebView)
В prod обязательно:
- `SameSite=None`
- `Secure=true`
- `Path=/auth`
- refresh token в httpOnly cookie
В dev:
- `SameSite=Lax`
- `Secure=false`

## Мониторинг
Sentry включается через env:
- backend: `SENTRY_DSN`
- admin: `NEXT_PUBLIC_SENTRY_DSN`
- miniapp: `VITE_SENTRY_DSN`
Без DSN Sentry не инициализируется.

## Бэкапы и восстановление
Для SQLite:
- ежедневный cron, хранить 7–14 дней.
- пример скрипта: `scripts/backup_sqlite.sh`
Восстановление: `scripts/restore_sqlite.sh`

Пример cron (ежедневно в 02:00):
```
0 2 * * * /opt/tezgo/scripts/backup_sqlite.sh >> /var/log/tezgo-backup.log 2>&1
```

## Чеклист перед релизом
1) HTTPS на всех доменах.
2) /health возвращает ok.
3) Login + refresh cookie работают после перезагрузки.
4) Sentry принимает ошибки.
5) Логи 5xx содержат request_id.
6) Миграции применены.
7) Бэкап сделан и restore протестирован.
8) CORS allowlist только нужные домены.
9) `SEED_DATA=false` в prod.
10) Резервный rollback план готов.
