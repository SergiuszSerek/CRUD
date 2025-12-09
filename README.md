# CRUD + PostgreSQL (minimalna zmiana)
Projekt jest zmodyfikowaną wersją poprzedniego CRUD — backend przeniesiony z SQLite na PostgreSQL, frontend bez zmian.

## Uruchomienie PostgreSQL
Utwórz bazę:
```bash
createdb entitydb
```

Utwórz tabelę:
```sql
CREATE TABLE IF NOT EXISTS entities (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  amount REAL NOT NULL,
  description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

## Backend — konfiguracja
Utwórz plik `.env` w folderze `server`:
```
PGHOST=localhost
PGUSER=postgres
PGPASSWORD=yourpass
PGDATABASE=entitydb
PGPORT=5432
```

## Start backendu
```bash
cd server
npm install
npm start
```

## Frontend
Otwórz plik `frontend/index.html`.
