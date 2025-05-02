const axios = require('axios');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const URL = 'https://raw.githubusercontent.com/Cskhatua/Testapp/refs/heads/gh-pages/allReport.json';
const DB_FILE = path.join(__dirname, 'allReport.db');

async function fetchAndInsert() {
  try {
    console.log('🔄 Fetching JSON from URL...');
    const response = await axios.get(URL);
    const data = response.data;

    if (!Array.isArray(data)) {
      throw new Error('Fetched data is not an array.');
    }

    console.log('📦 JSON data fetched. Preparing database...');

    const db = new sqlite3.Database(DB_FILE);

    db.serialize(() => {
      db.run(`DROP TABLE IF EXISTS report`);
      db.run(`
        CREATE TABLE report (
          platform TEXT,
          reportFolder TEXT,
          startedIso TEXT,
          startedUnix INTEGER,
          endedIso TEXT,
          endedUnix INTEGER,
          totalDurationGo TEXT,
          totalDurationMs INTEGER,
          featuresPassed INTEGER,
          featuresFailed INTEGER,
          passChild INTEGER,
          failChild INTEGER,
          skipChild INTEGER
        )
      `);

      const insertStmt = db.prepare(`
        INSERT INTO report (
          platform, reportFolder, startedIso, startedUnix, endedIso, endedUnix,
          totalDurationGo, totalDurationMs, featuresPassed, featuresFailed,
          passChild, failChild, skipChild
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      data.forEach(item => {
        insertStmt.run([
          item.platform,
          item.reportFolder,
          item.startedIso,
          item.startedUnix,
          item.endedIso,
          item.endedUnix,
          item.totalDurationGo,
          item.totalDurationMs,
          item.featuresPassed,
          item.featuresFailed,
          item.passChild,
          item.failChild,
          item.skipChild
        ]);
      });

      insertStmt.finalize();
      console.log('✅ Data inserted into SQLite DB: allReport.db');
    });

    db.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fetchAndInsert();
