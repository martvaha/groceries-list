import * as fs from 'fs-extra';
import * as path from 'path';
const config = require('../../angular.json');

const hostRoot = 'public';
const baseDir = path.join(__dirname, '..', '..', 'dist', 'apps', 'groceries-list', 'browser');

// Read source locale from config
let sourceLocale = config.projects['groceries-list'].i18n.sourceLocale;
sourceLocale = typeof sourceLocale === 'string' ? sourceLocale : sourceLocale.code;

// Move source locale to public folder
if (fs.pathExistsSync(path.join(baseDir, sourceLocale))) {
  fs.moveSync(path.join(baseDir, sourceLocale), path.join(baseDir, hostRoot));
}

const locales = fs
  .readdirSync(baseDir, { withFileTypes: true })
  .filter((dirent) => dirent.isDirectory() && dirent.name !== hostRoot)
  .map((dirent) => dirent.name);

for (const locale of locales) {
  fs.moveSync(path.join(baseDir, locale), path.join(baseDir, hostRoot, 'i18n', locale));
}
