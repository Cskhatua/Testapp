const fs = require('fs');
const path = require('path');

const combinedReportsPath = path.join(__dirname, 'combined-reports');
const indexPath = path.join(__dirname, 'index.html');

try {
  // Step 1: Get all folder names inside the `combined-reports` directory
  const existingFolders = fs.readdirSync(combinedReportsPath, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => `combined-reports/${dirent.name}`);

  // Step 2: Read the `index.html` file
  if (!fs.existsSync(indexPath)) {
    throw new Error(`File not found: ${indexPath}`);
  }
  let indexContent = fs.readFileSync(indexPath, 'utf8');

  // Step 3: Extract existing links from `index.html`
  const existingLinks = Array.from(indexContent.matchAll(/<a href="(combined-reports\/html-report-.*?)\/">/g))
    .map(match => match[1]);

  // Step 4: Find missing folders
  const missingFolders = existingFolders.filter(folder => !existingLinks.includes(folder));

  // Step 5: Generate new `<a>` tags for missing folders
  if (missingFolders.length > 0) {
    console.log('Adding missing folders to index.html...');
    const newLinks = missingFolders.map(folder => `<a href="${folder}/">${folder}/</a>`).join('\n');

    // Step 6: Insert the new links before the closing `</main>` tag
    indexContent = indexContent.replace(
      /<\/main>/,
      `${newLinks}\n</main>`
    );

    // Step 7: Write the updated content back to `index.html`
    fs.writeFileSync(indexPath, indexContent, 'utf8');
    console.log('Index.html updated successfully!');
  } else {
    console.log('No missing folders found. Index.html is up-to-date.');
  }
} catch (err) {
  console.error(`An error occurred: ${err.message}`);
}