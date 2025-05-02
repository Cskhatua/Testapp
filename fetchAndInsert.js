const axios = require('axios');
const sqlite3 = require('sqlite3').verbose();

const jsonUrl = 'https://raw.githubusercontent.com/Cskhatua/Testapp/refs/heads/gh-pages/iOSReportSummary.json';
const db = new sqlite3.Database('./report_summary.db');

async function fetchAndInsertJSON() {
  try {
    const response = await axios.get(jsonUrl);
    const data = response.data;

    db.serialize(() => {
      // Create summary table
      db.run(`CREATE TABLE IF NOT EXISTS summary (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        platform TEXT,
        totalReports INTEGER,
        totalFeaturesPassed INTEGER,
        totalFeaturesFailed INTEGER,
        totalPassChild INTEGER,
        totalFailChild INTEGER,
        totalSkipChild INTEGER,
        totalDurationMs INTEGER,
        totalDurationGo TEXT
      )`);

      // Clear previous summary data
      db.run(`DELETE FROM summary`);

      // Insert summary data
      const summaryStmt = db.prepare(`
        INSERT INTO summary (
          platform, totalReports, totalFeaturesPassed, totalFeaturesFailed,
          totalPassChild, totalFailChild, totalSkipChild, totalDurationMs, totalDurationGo
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      summaryStmt.run(
        data.platform,
        data.totalReports,
        data.totalFeaturesPassed,
        data.totalFeaturesFailed,
        data.totalPassChild,
        data.totalFailChild,
        data.totalSkipChild,
        data.totalDurationMs,
        data.totalDurationGo
      );
      summaryStmt.finalize();

      // Create reports table
      db.run(`CREATE TABLE IF NOT EXISTS reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
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
      )`);

      // Clear previous reports
      db.run(`DELETE FROM reports`);

      // Insert reports data
      const reportStmt = db.prepare(`
        INSERT INTO reports (
          reportFolder, startedIso, startedUnix, endedIso, endedUnix,
          totalDurationGo, totalDurationMs, featuresPassed, featuresFailed,
          passChild, failChild, skipChild
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      data.reports.forEach(report => {
        reportStmt.run(
          report.reportFolder,
          report.startedIso,
          report.startedUnix,
          report.endedIso,
          report.endedUnix,
          report.totalDurationGo,
          report.totalDurationMs,
          report.featuresPassed,
          report.featuresFailed,
          report.passChild,
          report.failChild,
          report.skipChild
        );
      });

      reportStmt.finalize();

      console.log("Summary and reports successfully stored in SQLite DB.");
    });

  } catch (error) {
    console.error("Error fetching or inserting data:", error);
  } finally {
    db.close();
  }
}

fetchAndInsertJSON();
