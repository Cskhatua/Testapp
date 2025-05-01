const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

// Get and sort Report_ folders (descending by name)
const getSortedReportFolders = (dirPath) => {
  try {
    const folders = fs.readdirSync(dirPath)
      .filter(item => {
        const fullPath = path.join(dirPath, item);
        return fs.statSync(fullPath).isDirectory() && item.startsWith('Report_');
      })
      .sort((a, b) => b.localeCompare(a)); // Descending by name

    return folders;
  } catch (error) {
    console.error(`Error reading directory ${dirPath}:`, error);
    return [];
  }
};

const updateIndexHtml = () => {
  const indexFilePath = path.join(__dirname, 'index.html');
  const androidDirPath = path.join(__dirname, 'Android');
  const iosDirPath = path.join(__dirname, 'iOS');

  try {
    const androidFolders = getSortedReportFolders(androidDirPath);
    const iosFolders = getSortedReportFolders(iosDirPath);

    const htmlContent = fs.readFileSync(indexFilePath, 'utf8');
    const dom = new JSDOM(htmlContent);
    const document = dom.window.document;

    const androidList = document.getElementById('android-report-links');
    const iosList = document.getElementById('ios-report-links');

    const existingAndroidLinks = Array.from(androidList?.querySelectorAll('a') || []).map(a => a.getAttribute('href'));
    const existingIosLinks = Array.from(iosList?.querySelectorAll('a') || []).map(a => a.getAttribute('href'));

    let linksAdded = 0;

    // Add Android links at the top
    if (androidList) {
      androidFolders.forEach(folder => {
        const href = `./Android/${folder}/index.html`;
        if (!existingAndroidLinks.includes(href)) {
          const li = document.createElement('li');
          const a = document.createElement('a');
          a.href = href;
          a.textContent = folder;
          li.appendChild(a);
          androidList.insertBefore(document.createTextNode('\n'), androidList.firstChild);
          androidList.insertBefore(li, androidList.firstChild);
          linksAdded++;
          console.log(`Added Android link: ${href}`);
        }
      });
    }

    // Add iOS links at the top
    if (iosList) {
      iosFolders.forEach(folder => {
        const href = `./iOS/${folder}/index.html`;
        if (!existingIosLinks.includes(href)) {
          const li = document.createElement('li');
          const a = document.createElement('a');
          a.href = href;
          a.textContent = folder;
          li.appendChild(a);
          iosList.insertBefore(document.createTextNode('\n'), iosList.firstChild);
          iosList.insertBefore(li, iosList.firstChild);
          linksAdded++;
          console.log(`Added iOS link: ${href}`);
        }
      });
    }

    if (linksAdded > 0) {
      fs.writeFileSync(indexFilePath, dom.serialize(), 'utf8');
      console.log(`index.html updated with ${linksAdded} new report link(s).`);
    } else {
      console.log('No new report links to add.');
    }

  } catch (error) {
    console.error('Error updating index.html:', error);
  }
};

// Run the update
updateIndexHtml();
