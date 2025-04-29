const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio'); // npm install cheerio

const androidDir = path.join(__dirname, 'Android');
const iosDir = path.join(__dirname, 'iOS');
const indexFile = path.join(__dirname, 'index.html');

// Utility function to find all subfolders containing index.html
function findReportFolders(baseDir) {
  const folders = fs.readdirSync(baseDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)
    .filter(subDir => fs.existsSync(path.join(baseDir, subDir, 'index.html')));
  return folders;
}

// Load the HTML file
const html = fs.readFileSync(indexFile, 'utf-8');
const $ = cheerio.load(html);

// Update Android Reports
const androidReports = findReportFolders(androidDir);
const $androidSection = $('#androidReports');
$androidSection.find('ul').remove(); // Clear old list
const $androidList = $('<ul></ul>');
androidReports.forEach(folder => {
  const url = `./Android/${folder}/index.html`;
  $androidList.append(`<li><a href="${url}">${folder}</a></li>`);
});
$androidSection.append($androidList);

// Update iOS Reports
const iosReports = findReportFolders(iosDir);
const $iosSection = $('#iosReports');
$iosSection.find('ul').remove(); // Clear old list
const $iosList = $('<ul></ul>');
iosReports.forEach(folder => {
  const url = `./iOS/${folder}/index.html`;
  $iosList.append(`<li><a href="${url}">${folder}</a></li>`);
});
$iosSection.append($iosList);

// Write the updated HTML back
fs.writeFileSync(indexFile, $.html(), 'utf-8');

console.log('Report links updated successfully.');
