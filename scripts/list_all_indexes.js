const fs = require('fs');
const content = fs.readFileSync('docs/crm/crm_final.dbml', 'utf8');

const tableRegex = /Table\s+(\w+)\s+{([^}]+)}/g;
let match;
const indexList = [];

while ((match = tableRegex.exec(content)) !== null) {
  const tableName = match[1];
  const body = match[2];
  const idxMatch = body.match(/indexes\s*{([^}]+)}/);
  if (idxMatch) {
    const lines = idxMatch[1].split('\n').map(l => l.trim()).filter(Boolean);
    for (const line of lines) {
      if (line.startsWith('//')) continue;
      indexList.push({
        table: tableName,
        raw: line
      });
    }
  }
}

console.log("Total parsed indexes:", indexList.length);
indexList.slice(0, 10).forEach((idx, i) => console.log(`${i+1}. [${idx.table}] ${idx.raw}`));
