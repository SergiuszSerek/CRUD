const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

const DB_FILE = './db.sqlite';
if (fs.existsSync(DB_FILE)) fs.unlinkSync(DB_FILE);

const db = new sqlite3.Database(DB_FILE);

const sql = `
CREATE TABLE entities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  extra_text TEXT
);

-- seed
INSERT INTO entities (name, type, description, extra_text) VALUES
  ('Alpha', 'typeA', 'Przykładowy obiekt Alpha', 'dodatkowe info A'),
  ('Beta', 'typeB', 'Przykładowy obiekt Beta', 'dodatkowe info B');
`;

db.exec(sql, (err) => {
  if (err) {
    console.error('Błąd migracji:', err);
    process.exit(1);
  } else {
    console.log('Migracja zakończona, plik:', DB_FILE);
    db.close();
  }
});
