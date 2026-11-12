const fs = require('fs');
const content = fs.readFileSync('docs/crm/crm_final.dbml', 'utf8');

const lines = content.split('\n');
let currentTable = null;
let inIndexes = false;
const indexList = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  if (line.startsWith('Table ')) {
    const parts = line.split(/\s+/);
    currentTable = parts[1];
  } else if (line.startsWith('indexes {')) {
    inIndexes = true;
  } else if (inIndexes && line === '}') {
    inIndexes = false;
  } else if (inIndexes && line && !line.startsWith('//')) {
    indexList.push({
      table: currentTable,
      line: line
    });
  } else if (line === '}' && !inIndexes) {
    currentTable = null;
  }
}

console.log("Total parsed indexes:", indexList.length);
indexList.forEach((idx, i) => console.log(`${i+1}. [${idx.table}] ${idx.line}`));
