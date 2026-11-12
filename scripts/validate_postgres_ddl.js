const fs = require('fs');

const sql = fs.readFileSync('docs/crm/crm_postgres.sql', 'utf8');

// 1. Extract Tables and Columns and Constraints
const tableRegex = /CREATE TABLE (\w+) \(([\s\S]*?)\n\);/g;
const tables = new Map();
let match;

while ((match = tableRegex.exec(sql)) !== null) {
  const tableName = match[1];
  const body = match[2];
  const columns = new Set();
  const uniqueConstraints = [];
  let primaryKeyCols = [];

  const lines = body.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('--'));

  for (const line of lines) {
    if (line.startsWith('CONSTRAINT')) {
      // CONSTRAINT name PRIMARY KEY (col1, col2)
      // CONSTRAINT name UNIQUE (col1, col2)
      const pkMatch = line.match(/CONSTRAINT\s+(\w+)\s+PRIMARY KEY\s*\(([^)]+)\)/i);
      if (pkMatch) {
        primaryKeyCols = pkMatch[2].split(',').map(s => s.trim());
      }
      const uqMatch = line.match(/CONSTRAINT\s+(\w+)\s+UNIQUE\s*\(([^)]+)\)/i);
      if (uqMatch) {
        uniqueConstraints.push({
          name: uqMatch[1],
          cols: uqMatch[2].split(',').map(s => s.trim())
        });
      }
    } else {
      // Column definition
      const parts = line.split(/\s+/);
      const colName = parts[0];
      columns.add(colName);
      if (line.includes('PRIMARY KEY')) {
        primaryKeyCols = [colName];
      }
      if (line.includes('UNIQUE')) {
        uniqueConstraints.push({
          name: `uq_${tableName}_${colName}`,
          cols: [colName]
        });
      }
    }
  }

  tables.set(tableName, {
    columns,
    primaryKeyCols,
    uniqueConstraints
  });
}

// 2. Extract Foreign Keys
const fkRegex = /ALTER TABLE (\w+)\s+ADD CONSTRAINT (\w+)\s+FOREIGN KEY \(([^)]+)\)\s+REFERENCES (\w+)\s*\(([^)]+)\)/g;
const fks = [];
const fkErrors = [];

while ((match = fkRegex.exec(sql)) !== null) {
  const fromTable = match[1];
  const fkName = match[2];
  const fromCols = match[3].split(',').map(s => s.trim());
  const toTable = match[4];
  const toCols = match[5].split(',').map(s => s.trim());

  fks.push({ fromTable, fkName, fromCols, toTable, toCols });

  if (!tables.has(fromTable)) {
    fkErrors.push(`From table ${fromTable} does not exist for FK ${fkName}`);
    continue;
  }
  if (!tables.has(toTable)) {
    fkErrors.push(`To table ${toTable} does not exist for FK ${fkName}`);
    continue;
  }

  const fromT = tables.get(fromTable);
  const toT = tables.get(toTable);

  for (const c of fromCols) {
    if (!fromT.columns.has(c)) {
      fkErrors.push(`From col ${c} not found in ${fromTable} for FK ${fkName}`);
    }
  }

  for (const c of toCols) {
    if (!toT.columns.has(c)) {
      fkErrors.push(`To col ${c} not found in ${toTable} for FK ${fkName}`);
    }
  }

  // Check if target cols are covered by PK or UNIQUE constraint
  const targetColsStr = toCols.join(',');
  const pkMatch = toT.primaryKeyCols.join(',') === targetColsStr;
  const uqMatch = toT.uniqueConstraints.some(uq => uq.cols.join(',') === targetColsStr);

  if (!pkMatch && !uqMatch) {
    fkErrors.push(`FK ${fkName} on ${fromTable}(${fromCols.join(',')}) references ${toTable}(${targetColsStr}), but ${toTable} has no matching PK or UNIQUE constraint on (${targetColsStr})! Available PK: (${toT.primaryKeyCols.join(',')}), UQs: ${JSON.stringify(toT.uniqueConstraints.map(u => u.cols))}`);
  }
}

// 3. Extract Secondary Indexes
const idxRegex = /CREATE INDEX (\w+) ON (\w+) \(([^)]+)\);/g;
const indexes = [];
const idxErrors = [];

while ((match = idxRegex.exec(sql)) !== null) {
  const idxName = match[1];
  const tableName = match[2];
  const cols = match[3].split(',').map(s => s.trim());

  indexes.push({ idxName, tableName, cols });

  if (!tables.has(tableName)) {
    idxErrors.push(`Index ${idxName} on table ${tableName} which does not exist`);
    continue;
  }

  const t = tables.get(tableName);
  for (const c of cols) {
    if (!t.columns.has(c)) {
      idxErrors.push(`Index ${idxName} references column ${c} which does not exist on table ${tableName}`);
    }
  }
}

console.log(JSON.stringify({
  tablesFound: tables.size,
  fksValidated: fks.length,
  indexesValidated: indexes.length,
  fkErrors,
  idxErrors
}, null, 2));

