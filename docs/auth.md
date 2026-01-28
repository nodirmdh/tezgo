# Аутентификация и сессии

## Цель
Единая система входа для всех ролей (client/partner/courier/admin/support) с «один раз вошёл».

## Потоки
1) Login: `POST /auth/login` → refresh cookie + access token (15 мин).
2) Refresh: `POST /auth/refresh` → rotation refresh, новый access token.
3) Logout: `POST /auth/logout` → revoke refresh + очистка cookie.
4) Register: `POST /auth/register` → только client.
5) Change password: `POST /auth/change-password` → сброс must_change_password.

## Токены
- Access token (JWT) хранится только в памяти фронта.
- Refresh token хранится в httpOnly cookie `refresh_token`.
- Ротация refresh при каждом `/auth/refresh`.

## Cookie настройки
- httpOnly: true
- secure: `NODE_ENV=production`
- sameSite:
  - dev: `lax`
  - prod: `none` (если домены разные) или `lax` (если один домен)
- path: `/auth`

## Роли и ограничения
- client: регистрация разрешена.
- partner/courier/admin/support: регистрация запрещена, создаются из админки.
- blocked → 403.

## Админ endpoints
- `GET /admin/users?role=partner|courier`
- `POST /admin/users`
- `POST /admin/users/:id/reset-password`
- `PATCH /admin/users/:id/status`

## Переменные окружения
- `JWT_SECRET`
- `ACCESS_TOKEN_TTL_MIN`
- `REFRESH_TOKEN_TTL_DAYS`
- `ALLOWED_ORIGINS`
- `COOKIE_SAMESITE`
- `TRUST_PROXY`
- `ADMIN_USERNAME`, `ADMIN_PASSWORD`
- `SUPPORT_USERNAME`, `SUPPORT_PASSWORD`

## Фронт интеграция
- Все запросы отправляются с `credentials: "include"`.
- При 401 выполняется один silent refresh и повтор запроса.
- При старте приложения выполняется `/auth/refresh`.
