# Sample Database Setup (PostgreSQL)

This project ships with a **hotel booking sample schema** used by the AI prompt-to-SQL features. The schema matches `DB_SCHEMA` in [`src/lib/constants.ts`](./src/lib/constants.ts).

## What gets created

| Table | Purpose |
| --- | --- |
| `customers` | Hotel customers |
| `rooms` | Room inventory and pricing |
| `bookings` | Reservations linking customers and rooms |
| `payments` | Payment records per booking |
| `guests` | Guests on a booking |
| `amenities` | Hotel amenities catalog |
| `room_amenities` | Many-to-many link between rooms and amenities |

The server also auto-creates `users` and `widgets` on startup (app metadata tables). The sample scripts only manage the hotel tables above.

## Prerequisites

- PostgreSQL 14+ installed and running
- `psql` available in your terminal

## 1. Create a database

```bash
createdb ai-dashboard-db
```

Or from `psql`:

```sql
CREATE DATABASE "ai-dashboard-db";
```

## 2. Configure the server `.env`

Create `server/.env` (see [`env.d.ts`](./env.d.ts) for all variables) and set your PostgreSQL connection:

```env
DB_USER=your_pg_user
DB_PASSWORD=your_pg_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ai-dashboard-db
```

## 3. Load the sample schema

From the **repository root**:

```bash
psql -h localhost -p 5432 -U your_pg_user -d ai-dashboard-db \
  -f server/scripts/init-hotel-schema.sql
```

This creates all hotel tables and `updated_at` triggers.

> **Warning:** Re-running this script **drops and recreates** the hotel tables (`customers`, `rooms`, `bookings`, `payments`, `guests`, `amenities`, `room_amenities`). It does not touch `users` or `widgets`.

## 4. Load sample data (optional)

```bash
psql -h localhost -p 5432 -U your_pg_user -d ai-dashboard-db \
  -f server/scripts/seed-hotel-data.sql
```

Adds sample customers, rooms, amenities, bookings, payments, and guests so you can try prompts immediately.

## 5. Verify

```bash
psql -h localhost -p 5432 -U your_pg_user -d ai-dashboard-db -c "\dt"
```

You should see the hotel tables plus `users` and `widgets` (after starting the server once).

Quick row counts:

```sql
SELECT 'customers' AS table_name, COUNT(*) FROM customers
UNION ALL SELECT 'rooms', COUNT(*) FROM rooms
UNION ALL SELECT 'bookings', COUNT(*) FROM bookings;
```

Expected after seeding: 5 customers, 6 rooms, 3 bookings.

## 6. Start the server

```bash
cd server
npm run dev
```

On first connect you should see:

```
PostgreSQL database connected successfully!
PostgreSQL database tables initialized successfully!
```

## Using your own data instead

If you use a different database or schema:

1. Point `DB_*` variables in `server/.env` at your database.
2. Update `DB_SCHEMA` in [`src/lib/constants.ts`](./src/lib/constants.ts) so the AI knows your table/column names.
3. Skip the sample SQL scripts, or adapt them for your schema.

## Troubleshooting

| Issue | Fix |
| --- | --- |
| `database "ai-dashboard-db" does not exist` | Run step 1 (`createdb`) |
| `role "your_pg_user" does not exist` | Create the user or use an existing PostgreSQL role |
| `password authentication failed` | Set `DB_PASSWORD` in `.env` or use peer auth locally |
| `relation "users" does not exist` on server start | Pull latest server code; `users`/`widgets` are created automatically on startup |
| Permission denied on `psql -f` | Use a DB user with `CREATE` privileges on the target database |

## Related docs

- [`DB.md`](./DB.md) — full schema reference and ER notes
- [`DEV-SETUP.md`](./DEV-SETUP.md) — server development setup
