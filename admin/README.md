# Admin Panel (Next.js)

## Deploy на Vercel
1. Создайте новый проект в Vercel и укажите корень `admin/`.
2. Убедитесь, что в Vercel выставлен `Framework Preset: Next.js`.
3. Добавьте переменные окружения из `.env.example`.
4. Деплой выполнится автоматически при пуше в ветку.

## Локальный запуск
```bash
npm install
npm run dev
```

## Примечания
- Авторизация в MVP — stub по `tg_id` (локально сохраняется в `localStorage`).
