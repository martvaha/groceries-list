import * as fs from 'fs-extra';
import * as path from 'path';
import { exit } from 'process';
const config = require('../../angular.json');

const baseDir = path.join(__dirname, '..', '..', 'dist', 'apps', 'groceries-list', 'browser');

// Read source locale from config
let sourceLocale = config.projects['groceries-list'].i18n.sourceLocale;
sourceLocale = typeof sourceLocale === 'string' ? sourceLocale : sourceLocale.code;

if (!fs.pathExistsSync(path.join(baseDir, sourceLocale))) {
  console.log(`Source locale not found. Either already converted or build is missing.`);
  exit(0);
}

const locales = fs
  .readdirSync(baseDir, { withFileTypes: true })
  .filter((dirent) => dirent.isDirectory())
  .map((dirent) => dirent.name);

for (const locale of locales) {
  fs.moveSync(path.join(baseDir, locale), path.join(baseDir, 'i18n', locale));
}

// Move source locale to root path
fs.copySync(path.join(baseDir, 'i18n', sourceLocale), baseDir);
// fs.rmdirSync(path.join(baseDir, 'i18n', sourceLocale), { recursive: true });
