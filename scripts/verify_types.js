const fs = require('fs');
const content = fs.readFileSync('docs/crm/crm_final.dbml', 'utf8');

// Parse Enums
const enumRegex = /Enum\s+(\w+)\s+{([^}]+)}/g;
const enums = new Set();
let match;
while ((match = enumRegex.exec(content)) !== null) {
  enums.add(match[1]);
}

const standardTypes = new Set([
  'uuid', 'varchar', 'text', 'boolean', 'int', 'bigint', 'decimal',
  'timestamp', 'date', 'time'
]);

// Parse columns and their types
const tableRegex = /Table\s+(\w+)\s+{([^}]+)}/g;
const typeErrors = [];
let totalColumns = 0;
let totalIndexes = 0;

while ((match = tableRegex.exec(content)) !== null) {
  const tableName = match[1];
  const body = match[2];
  const lines = body.split('\n');
  let inIndexes = false;
  for (let line of lines) {
    line = line.trim();
    if (!line || line.startsWith('//')) continue;
    if (line.startsWith('indexes {')) {
      inIndexes = true;
      continue;
    }
    if (inIndexes) {
      if (line === '}') {
        inIndexes = false;
      } else {
        totalIndexes++;
      }
      continue;
    }
    if (line.startsWith('Note:')) continue;
    const parts = line.split(/\s+/);
    if (parts.length >= 2) {
      totalColumns++;
      const colName = parts[0];
      let colType = parts[1].replace(/\(.*\)/, '');
      if (!standardTypes.has(colType) && !enums.has(colType)) {
        typeErrors.push(`Unknown type ${colType} on ${tableName}.${colName}`);
      }
    }
  }
}

console.log(JSON.stringify({
  totalColumns,
  totalIndexes,
  typeErrors
}, null, 2));
