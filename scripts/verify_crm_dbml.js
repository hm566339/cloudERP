const fs = require('fs');

const content = fs.readFileSync('docs/crm/crm_final_corrected.dbml', 'utf8');

// Parse Enums
const enumRegex = /Enum\s+(\w+)\s+{([^}]+)}/g;
const enums = new Map();
let match;
while ((match = enumRegex.exec(content)) !== null) {
  const name = match[1];
  const body = match[2];
  const values = body.split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('//'))
    .map(line => line.split(/\s+/)[0]);
  enums.set(name, values);
}

// Parse Tables and Columns
const tableRegex = /Table\s+(\w+)\s+{([^}]+)}/g;
const tables = new Map();
while ((match = tableRegex.exec(content)) !== null) {
  const name = match[1];
  const body = match[2];
  const lines = body.split('\n');
  const cols = new Set();
  let inIndexes = false;
  for (let line of lines) {
    line = line.trim();
    if (!line || line.startsWith('//')) continue;
    if (line.startsWith('indexes {')) {
      inIndexes = true;
      continue;
    }
    if (inIndexes) {
      if (line === '}') inIndexes = false;
      continue;
    }
    if (line.startsWith('Note:')) continue;
    const parts = line.split(/\s+/);
    if (parts.length >= 2) {
      cols.add(parts[0]);
    }
  }
  tables.set(name, cols);
}

// Parse Refs (supporting single column and composite columns e.g. (c1, c2))
const refRegex = /Ref:\s*(\w+)\.((?:\([^)]+\)|\w+))\s*([><\-])\s*(\w+)\.((?:\([^)]+\)|\w+))/g;
const refs = [];
const refErrors = [];
while ((match = refRegex.exec(content)) !== null) {
  const [_, t1, rawC1, op, t2, rawC2] = match;
  const parseCols = (str) => str.replace(/[()]/g, '').split(',').map(s => s.trim()).filter(Boolean);
  const cols1 = parseCols(rawC1);
  const cols2 = parseCols(rawC2);
  refs.push({ t1, cols1, op, t2, cols2 });
  if (!tables.has(t1)) {
    refErrors.push(`Table ${t1} not found in Ref ${t1}.${rawC1} -> ${t2}.${rawC2}`);
  } else {
    for (const c of cols1) {
      if (!tables.get(t1).has(c)) {
        refErrors.push(`Column ${c} not found in Table ${t1}`);
      }
    }
  }
  if (!tables.has(t2)) {
    refErrors.push(`Table ${t2} not found in Ref ${t1}.${rawC1} -> ${t2}.${rawC2}`);
  } else {
    for (const c of cols2) {
      if (!tables.get(t2).has(c)) {
        refErrors.push(`Column ${c} not found in Table ${t2}`);
      }
    }
  }
}

// Parse TableGroups
const tgRegex = /TableGroup\s+(\w+)\s*{([^}]+)}/g;
const tableGroups = new Map();
const tgErrors = [];
while ((match = tgRegex.exec(content)) !== null) {
  const name = match[1];
  const body = match[2];
  const memberTables = body.split(/\s+/).map(s => s.trim()).filter(Boolean);
  tableGroups.set(name, memberTables);
  for (const t of memberTables) {
    if (!tables.has(t)) {
      tgErrors.push(`Table ${t} in TableGroup ${name} does not exist`);
    }
  }
}

console.log(JSON.stringify({
  totalTables: tables.size,
  totalEnums: enums.size,
  totalRefs: refs.length,
  totalTableGroups: tableGroups.size,
  refErrors,
  tgErrors
}, null, 2));
