# The Last of Guss - Docker Setup

## Быстрый старт

```bash
# Собрать и запустить все сервисы
docker-compose up --build

# Или в фоновом режиме
docker-compose up -d --build
```

## Доступ после запуска

- **Frontend**: http://localhost
- **Backend API**: http://localhost:3000
- **PostgreSQL**: localhost:6543

## Остановка

```bash
# Остановить сервисы
docker-compose down

# Остановить и удалить данные БД
docker-compose down -v
```

## Пересборка

```bash
# Пересобрать все образы
docker-compose up --build

# Пересобрать только backend
docker-compose up --build backend

# Пересобрать только frontend
docker-compose up --build frontend
```

## Логи

```bash
# Все сервисы
docker-compose logs -f

# Конкретный сервис
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

## Переменные окружения

Настройки в `docker-compose.yml`:

| Переменная | Значение | Описание |
|------------|----------|----------|
| `DB_URI` | `postgresql://postgres:postgres@postgres:5432/eng_test` | Подключение к БД |
| `PORT` | `3000` | Порт backend |
| `JWT_SECRET` | `your-secret-key-change-in-production` | Секрет JWT |
| `COOLDOWN_DURATION` | `60` | Время ожидания до начала раунда (сек) |
| `ROUND_DURATION` | `30` | Длительность раунда (сек) |

## Архитектура

```
┌─────────────┐
│   Nginx     │  ← Frontend (port 80)
│  (React)    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   NestJS    │  ← Backend API (port 3000)
│  (Node.js)  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  PostgreSQL │  ← Database (port 6543)
└─────────────┘
```

## Тестовые пользователи

- `admin/admin` — администратор (может создавать раунды)
- `roma/roma` — обычный игрок
- `Никита/любой пароль` — игрок с нулевым счетом
