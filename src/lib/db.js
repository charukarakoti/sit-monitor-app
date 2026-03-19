import Database from "better-sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "monitor.db");
const db = new Database(dbPath);

// ADD REQUIRED COLUMNS
const columns = [
  "hostingExpiry TEXT",
  "domainExpiry TEXT",
  "lastStatus TEXT"
];

for (const col of columns) {
  try {
    db.prepare(`ALTER TABLE sites ADD COLUMN ${col}`).run();
  } catch (e) {}
}

// CREATE TABLE
db.exec(`
  CREATE TABLE IF NOT EXISTS sites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT UNIQUE,
    status TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    ipAddress TEXT,
    hostingExpiry TEXT,
    domainExpiry TEXT,
    lastStatus TEXT
  );
`);

export default db;