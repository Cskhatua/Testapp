const fs = require('fs');
const path = require('path');

const platforms = ['Android', 'iOS'];

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

  let reportSummaries = [];

  reportFolders.forEach(folder => {
    const indexPath = path.join(platformDir, folder, 'index.html');

    if (!fs.existsSync(indexPath)) {
      console.warn(`⚠️  index.html not found in ${folder}`);
      return;
    }

    const htmlContent = fs.readFileSync(indexPath, 'utf-8');

    // Extract the statusGroup block using RegExp
    const statusGroupMatch = htmlContent.match(/var\s+statusGroup\s*=\s*{[^}]*}/);
    if (!statusGroupMatch) {
      console.warn(`⚠️  statusGroup block not found in ${folder}`);
      return;
    }

    // Safely evaluate the statusGroup block (using Function constructor to avoid eval)
    const statusGroupBlock = statusGroupMatch[0]
      .replace(/^var\s+statusGroup\s*=\s*/, '') // Remove var declaration
      .replace(/;$/, ''); // Remove trailing semicolon

    let statusGroup;
    try {
      statusGroup = new Function(`return ${statusGroupBlock}`)();
    } catch (error) {
      console.error(`❌ Error parsing statusGroup in ${folder}:`, error);
      return;
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
    reports: reportSummaries
  };

  const outputFile = `${platform}ReportSummary.json`;
  fs.writeFileSync(outputFile, JSON.stringify(outputData, null, 2), 'utf-8');
  console.log(`✅ Extracted data and saved to: ${outputFile}`);
});
