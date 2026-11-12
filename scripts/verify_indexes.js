const fs = require('fs');
const content = fs.readFileSync('docs/crm/crm_final.dbml', 'utf8');

const tableRegex = /Table\s+(\w+)\s+{([^}]+)}/g;
const indexErrors = [];

while ((match = tableRegex.exec(content)) !== null) {
  const tableName = match[1];
  const body = match[2];
  const lines = body.split('\n');
  const cols = new Set();
  let inIndexes = false;
  const indexLines = [];
  
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
        indexLines.push(line);
      }
      continue;
    }
    if (line.startsWith('Note:')) continue;
    const parts = line.split(/\s+/);
    if (parts.length >= 2) {
      cols.add(parts[0]);
    }
  }

  for (const idxLine of indexLines) {
    // e.g. (company_id, lead_code) [unique, name: '...'] or lead_id [name: '...']
    const colMatch = idxLine.match(/^\(?([a-zA-Z0-9_,\s]+)\)?\s*\[/);
    if (colMatch) {
      const idxCols = colMatch[1].split(',').map(s => s.trim());
      for (const c of idxCols) {
        if (!cols.has(c)) {
          indexErrors.push(`Index on ${tableName} references non-existent column: ${c}`);
        }
      }
    }
  }
}

console.log(JSON.stringify({
  indexErrors
}, null, 2));
