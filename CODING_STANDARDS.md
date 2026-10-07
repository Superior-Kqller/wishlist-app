## Перед коммитом

`npm run lint`, `npm run typecheck`, `npm test` — зелёные. Typecheck — отдельный шаг: vitest типы не проверяет, а `next build` не тайпчекает тестовые файлы. Prettier прогоняет pre-commit хук (husky + lint-staged).

E2E (`npm run test:e2e`, Playwright) — вручную при изменениях в UI-потоках: CI его не запускает.

## Язык

Пользовательские тексты в репозитории — по возможности на русском.
