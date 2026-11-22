const fs = require('node:fs');
const path = require('node:path');

global.window = {};
const localData = path.join(__dirname, '../site/assets/data.js');
require(fs.existsSync(localData) ? localData : path.join(__dirname, '../assets/data.js'));
const { works, topics } = window.GRADIVO;
const map = entries => Object.fromEntries(entries.map(({ id, title }) => [id, title]));
const catalog = {
  dela: { 0: 'Splošno o delih', ...map(works) },
  teme: { 0: 'Splošno o tretjem vprašanju', ...map(topics) },
};
fs.writeFileSync(path.join(__dirname, 'catalog.json'), JSON.stringify(catalog, null, 2) + '\n');
