const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, 'index.html');

// List of new links to be added
const newLinks = [
  'combined-reports/html-report-2025-04-11T10-42-40/',
  'combined-reports/html-report-2025-04-12T20-33-13/',
  'combined-reports/html-report-2025-04-12T20-56-17/',
  'combined-reports/html-report-2025-04-12T21-01-57/',
  'combined-reports/html-report-2025-04-12T21-07-40/',
  'combined-reports/html-report-2025-04-13T05-26-18/',
  'combined-reports/html-report-2025-04-13T07-46-29/',
  'combined-reports/html-report-2025-04-13T07-54-13/',
  'combined-reports/html-report-2025-04-13T08-00-46/',
  'combined-reports/html-report-2025-04-13T08-05-27/',
  'combined-reports/html-report-2025-04-13T08-10-10/',
  'combined-reports/html-report-2025-04-13T08-13-40/',
  'combined-reports/html-report-2025-04-13T08-15-25/',
  'combined-reports/html-report-2025-04-13T13-55-57/',
  'combined-reports/html-report-2025-04-13T13-57-30/',
  'combined-reports/html-report-2025-04-13T14-49-43/',
  'combined-reports/html-report-2025-04-13T15-18-26/',
  'combined-reports/html-report-2025-04-16T12-23-07/',
  'combined-reports/html-report-2025-04-16T13-13-08/',
  'combined-reports/html-report-2025-04-16T13-21-19/',
  'combined-reports/html-report-2025-04-16T13-23-46/',
  'combined-reports/html-report-2025-04-16T13-37-53/',
  'combined-reports/html-report-2025-04-16T13-39-36/',
  'combined-reports/html-report-2025-04-16T15-52-06/',
  'combined-reports/html-report-2025-04-16T16-04-06/',
  'combined-reports/html-report-2025-04-17T08-13-31/',
  'combined-reports/html-report-2025-04-18T16-21-09/',
  'combined-reports/html-report-2025-04-18T16-29-42/',
  'combined-reports/html-report-2025-04-18T16-34-11/',
  'combined-reports/html-report-2025-04-18T16-41-57/',
  'combined-reports/html-report-2025-04-18T16-59-46/',
  'combined-reports/html-report-2025-04-18T17-12-52/',
  'combined-reports/html-report-2025-04-18T18-04-04/',
];

try {
  // Step 1: Read the `index.html` file
  if (!fs.existsSync(indexPath)) {
    throw new Error(`File not found: ${indexPath}`);
  }
  let indexContent = fs.readFileSync(indexPath, 'utf8');

  // Step 2: Extract existing links from `index.html`
  const existingLinks = Array.from(indexContent.matchAll(/<a href="(combined-reports\/html-report-.*?)\/">/g))
    .map(match => match[1] + '/');

  // Step 3: Combine new and existing links, and remove duplicates
  const allLinks = Array.from(new Set([...existingLinks, ...newLinks]));

  // Step 4: Sort the links by date (latest first)
  const sortedLinks = allLinks.sort((a, b) => {
    const dateA = new Date(a.match(/html-report-(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2})/)[1].replace(/-/g, ':').replace('T', ' '));
    const dateB = new Date(b.match(/html-report-(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2})/)[1].replace(/-/g, ':').replace('T', ' '));
    return dateB - dateA; // Descending order
  });

  // Step 5: Generate new `<a>` tags for the sorted links
  const updatedLinks = sortedLinks.map(link => `<a href="${link}">${link}</a>`).join('\n');

  // Step 6: Insert the updated links before the closing `</main>` tag
  indexContent = indexContent.replace(
    /<\/main>/,
    `${updatedLinks}\n</main>`
  );

  // Step 7: Write the updated content back to `index.html`
  fs.writeFileSync(indexPath, indexContent, 'utf8');
  console.log('Index.html updated successfully!');
} catch (err) {
  console.error(`An error occurred: ${err.message}`);
}