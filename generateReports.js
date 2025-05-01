const fs = require('fs');
const path = require('path');

const platforms = ['Android', 'iOS'];

// Helper to convert "01.18.2025 14:11:54" → "2025-01-18T14:11:54"
function toIsoTime(dateStr) {
  const match = dateStr.match(/(\d{2})\.(\d{2})\.(\d{4}) (\d{2}):(\d{2}):(\d{2})/);
  if (!match) return null;

  const [, month, day, year, hour, minute, second] = match;
  return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
}

// Convert to Unix timestamp (ms)
function toUnixTimestamp(dateStr) {
  const match = dateStr.match(/(\d{2})\.(\d{2})\.(\d{4}) (\d{2}):(\d{2}):(\d{2})/);
  if (!match) return null;

  const [, month, day, year, hour, minute, second] = match.map(Number);
  const date = new Date(year, month - 1, day, hour, minute, second);
  return date.getTime();
}

// Convert "00:05:41:636" → "5m41.636s"
function toGoDuration(durationStr) {
  const match = durationStr.match(/(\d{2}):(\d{2}):(\d{2}):(\d{3})/);
  if (!match) return null;

  const [, hours, minutes, seconds, milliseconds] = match.map(Number);
  const totalMinutes = hours * 60 + minutes;
  return `${totalMinutes}m${seconds}.${String(milliseconds).padStart(3, '0')}s`;
}

// Convert to total milliseconds
function toMilliseconds(durationStr) {
  const match = durationStr.match(/(\d{2}):(\d{2}):(\d{2}):(\d{3})/);
  if (!match) return null;

  const [, hours, minutes, seconds, milliseconds] = match.map(Number);
  return ((hours * 60 + minutes) * 60 + seconds) * 1000 + milliseconds;
}

// Main processing
platforms.forEach(platform => {
  const platformDir = path.join(__dirname, platform);

  if (!fs.existsSync(platformDir)) {
    console.warn(`⚠️  Platform folder not found: ${platform}`);
    return;
  }

  const reportFolders = fs.readdirSync(platformDir).filter(name =>
    fs.statSync(path.join(platformDir, name)).isDirectory() &&
    name.startsWith('Report')
  );

  if (reportFolders.length === 0) {
    console.warn(`⚠️  No 'Report*' folders found in ${platform}`);
    return;
  }

  let totalFeaturesPassed = 0;
  let totalFeaturesFailed = 0;
  let totalPassChild = 0;
  let totalFailChild = 0;
  let totalSkipChild = 0;
  let totalDurationMsSum = 0;

  let reportSummaries = [];

  reportFolders.forEach(folder => {
    const indexPath = path.join(platformDir, folder, 'index.html');

    if (!fs.existsSync(indexPath)) {
      console.warn(`⚠️  index.html not found in ${folder}`);
      return;
    }

    const htmlContent = fs.readFileSync(indexPath, 'utf-8');

    // Extract statusGroup block
    const statusGroupMatch = htmlContent.match(/var\s+statusGroup\s*=\s*{[^}]*}/);
    if (!statusGroupMatch) {
      console.warn(`⚠️  statusGroup block not found in ${folder}`);
      return;
    }

    const statusGroupBlock = statusGroupMatch[0]
      .replace(/^var\s+statusGroup\s*=\s*/, '')
      .replace(/;$/, '');

    let statusGroup;
    try {
      statusGroup = new Function(`return ${statusGroupBlock}`)();
    } catch (error) {
      console.error(`❌ Error parsing statusGroup in ${folder}:`, error);
      return;
    }

    // Extract start, end, and duration
    const startEndDurationMatch = htmlContent.match(
      /<span class='badge badge-success'>(.*?)<\/span>[\s\S]*?<span class='badge badge-danger'>(.*?)<\/span>[\s\S]*?<span class='badge badge-default'>(.*?)<\/span>/i
    );

    let startedIso = null;
    let startedUnix = null;
    let endedIso = null;
    let endedUnix = null;
    let durationGo = null;
    let durationMs = null;

    if (startEndDurationMatch) {
      const [ , rawStart, rawEnd, rawDuration ] = startEndDurationMatch.map(str => str.trim());

      startedIso = toIsoTime(rawStart);
      startedUnix = toUnixTimestamp(rawStart);
      endedIso = toIsoTime(rawEnd);
      endedUnix = toUnixTimestamp(rawEnd);
      durationGo = toGoDuration(rawDuration);
      durationMs = toMilliseconds(rawDuration);
      totalDurationMsSum += durationMs || 0;
    } else {
      console.warn(`⚠️  Start/end/duration not found in ${folder}`);
    }

    const featuresPassed = statusGroup.passParent || 0;
    const featuresFailed = statusGroup.failParent || 0;
    const passChild = statusGroup.passChild || 0;
    const failChild = statusGroup.failChild || 0;
    const skipChild = statusGroup.skipChild || 0;

    totalFeaturesPassed += featuresPassed;
    totalFeaturesFailed += featuresFailed;
    totalPassChild += passChild;
    totalFailChild += failChild;
    totalSkipChild += skipChild;

    reportSummaries.push({
      reportFolder: folder,
      startedIso,
      startedUnix,
      endedIso,
      endedUnix,
      totalDurationGo: durationGo,
      totalDurationMs: durationMs,
      featuresPassed,
      featuresFailed,
      passChild,
      failChild,
      skipChild
    });
  });

  const outputData = {
    platform,
    totalReports: reportFolders.length,
    totalFeaturesPassed,
    totalFeaturesFailed,
    totalPassChild,
    totalFailChild,
    totalSkipChild,
    totalDurationMs: totalDurationMsSum,
    totalDurationGo: toGoDurationFromMs(totalDurationMsSum),
    reports: reportSummaries
  };

  const outputFile = `${platform}ReportSummary.json`;
  fs.writeFileSync(outputFile, JSON.stringify(outputData, null, 2), 'utf-8');
  console.log(`✅ Extracted data and saved to: ${outputFile}`);
});

// Helper to convert milliseconds to Go duration
function toGoDurationFromMs(ms) {
  if (!ms || isNaN(ms)) return null;

  const totalSeconds = Math.floor(ms / 1000);
  const milliseconds = ms % 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}m${seconds}.${String(milliseconds).padStart(3, '0')}s`;
}
