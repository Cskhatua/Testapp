const fs = require('fs');
const path = require('path');

const platforms = ['Android', 'iOS'];
const flattenedReports = [];

// Helper functions
function toIsoTime(dateStr) {
  const match = dateStr.match(/(\d{2})\.(\d{2})\.(\d{4}) (\d{2}):(\d{2}):(\d{2})/);
  if (!match) return null;
  const [, month, day, year, hour, minute, second] = match;
  return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
}

function toUnixTimestamp(dateStr) {
  const match = dateStr.match(/(\d{2})\.(\d{2})\.(\d{4}) (\d{2}):(\d{2}):(\d{2})/);
  if (!match) return null;
  const [, month, day, year, hour, minute, second] = match.map(Number);
  const date = new Date(year, month - 1, day, hour, minute, second);
  return date.getTime();
}

function toGoDuration(durationStr) {
  const match = durationStr.match(/(\d{2}):(\d{2}):(\d{2}):(\d{3})/);
  if (!match) return null;
  const [, hours, minutes, seconds, milliseconds] = match.map(Number);
  const totalMinutes = hours * 60 + minutes;
  return `${totalMinutes}m${seconds}.${String(milliseconds).padStart(3, '0')}s`;
}

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

  reportFolders.forEach(folder => {
    const indexPath = path.join(platformDir, folder, 'index.html');

    if (!fs.existsSync(indexPath)) {
      console.warn(`⚠️  index.html not found in ${folder}`);
      return;
    }

    const htmlContent = fs.readFileSync(indexPath, 'utf-8');

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

    const startEndDurationMatch = htmlContent.match(
      /<span class='badge badge-success'>(.*?)<\/span>[\s\S]*?<span class='badge badge-danger'>(.*?)<\/span>[\s\S]*?<span class='badge badge-default'>(.*?)<\/span>/i
    );

    let startedIso = null, startedUnix = null, endedIso = null, endedUnix = null, durationGo = null, durationMs = null;

    if (startEndDurationMatch) {
      const [ , rawStart, rawEnd, rawDuration ] = startEndDurationMatch.map(str => str.trim());
      startedIso = toIsoTime(rawStart);
      startedUnix = toUnixTimestamp(rawStart);
      endedIso = toIsoTime(rawEnd);
      endedUnix = toUnixTimestamp(rawEnd);
      durationGo = toGoDuration(rawDuration);
      durationMs = toMilliseconds(rawDuration);
    } else {
      console.warn(`⚠️  Start/end/duration not found in ${folder}`);
    }

    const featuresPassed = statusGroup.passParent || 0;
    const featuresFailed = statusGroup.failParent || 0;
    const passChild = statusGroup.passChild || 0;
    const failChild = statusGroup.failChild || 0;
    const skipChild = statusGroup.skipChild || 0;

    // Push flattened report
    flattenedReports.push({
      platform,
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
});

// Save flattened JSON
fs.writeFileSync('allReport.json', JSON.stringify(flattenedReports, null, 2), 'utf-8');
console.log('✅ Flattened report saved to: allReport.json');

