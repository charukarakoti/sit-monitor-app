const db = require('better-sqlite3')('./monitor.db');
console.log(db.prepare("SELECT url, lastStatus, downSince FROM sites WHERE url LIKE '%test-123%'").get());
