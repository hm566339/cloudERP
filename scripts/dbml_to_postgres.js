const fs = require('fs');
const path = require('path');

const dbmlContent = fs.readFileSync('docs/crm/crm_final_corrected.dbml', 'utf8');

// 1. Parse Enums
const enumRegex = /Enum\s+(\w+)\s+{([^}]+)}/g;
const enums = [];
let match;
while ((match = enumRegex.exec(dbmlContent)) !== null) {
  const name = match[1];
  const body = match[2];
  const values = body.split('\n')
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('//'))
    .map(l => l.split(/\s+/)[0]);
  enums.push({ name, values });
}

// 2. Parse Tables
const lines = dbmlContent.split('\n');
const tables = [];
let currentTable = null;
let inIndexes = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  if (line.startsWith('//') || !line) continue;

  if (line.startsWith('Table ')) {
    const parts = line.split(/\s+/);
    currentTable = {
      name: parts[1],
      columns: [],
      indexes: [],
      note: ''
    };
    tables.push(currentTable);
  } else if (currentTable && line.startsWith('indexes {')) {
    inIndexes = true;
  } else if (inIndexes && line === '}') {
    inIndexes = false;
  } else if (inIndexes && currentTable) {
    // Parse index line
    // e.g. (company_id, lead_code) [unique, name: 'uq_crm_lead_company_code']
    // e.g. (company_id, lead_id, tag_id) [pk]
    // e.g. lead_id [name: 'idx_crm_lead_assign_lead']
    const idxMatch = line.match(/^(\([^\)]+\)|[^\s\[]+)\s*(\[([^\]]+)\])?/);
    if (idxMatch) {
      const colsRaw = idxMatch[1].replace(/[()]/g, '');
      const cols = colsRaw.split(',').map(s => s.trim()).filter(Boolean);
      const propsStr = idxMatch[3] || '';
      const isPk = propsStr.includes('pk');
      const isUnique = propsStr.includes('unique');
      const nameMatch = propsStr.match(/name:\s*'([^']+)'/);
      const indexName = nameMatch ? nameMatch[1] : null;
      currentTable.indexes.push({ cols, isPk, isUnique, indexName });
    }
  } else if (!inIndexes && currentTable && line === '}') {
    currentTable = null;
  } else if (!inIndexes && currentTable) {
    if (line.startsWith('Note:')) {
      const noteMatch = line.match(/Note:\s*'([^']+)'/);
      if (noteMatch) currentTable.note = noteMatch[1];
    } else {
      // Column definition
      // e.g. id uuid [pk, default: `gen_random_uuid()`, note: 'Primary Key']
      // e.g. company_id uuid [not null, note: 'Tenant isolation']
      const colMatch = line.match(/^([a-zA-Z0-9_]+)\s+([a-zA-Z0-9_(),]+)\s*(\[([^\]]+)\])?/);
      if (colMatch) {
        const colName = colMatch[1];
        const colType = colMatch[2];
        const propsStr = colMatch[4] || '';
        const isPk = propsStr.includes('pk');
        const notNull = propsStr.includes('not null');
        const isUnique = propsStr.includes('unique');
        
        let defaultValue = null;
        const defMatch = propsStr.match(/default:\s*(`[^`]+`|'[^']+'|[^\s,\]]+)/);
        if (defMatch) {
          defaultValue = defMatch[1].replace(/^`|`$/g, '');
        }

        let note = null;
        const noteMatch = propsStr.match(/note:\s*'([^']+)'/);
        if (noteMatch) note = noteMatch[1];

        currentTable.columns.push({
          name: colName,
          type: colType,
          isPk,
          notNull,
          isUnique,
          defaultValue,
          note
        });
      }
    }
  }
}

// 3. Parse Refs
const refRegex = /Ref:\s*(\w+)\.((?:\([^)]+\)|\w+))\s*([><\-])\s*(\w+)\.((?:\([^)]+\)|\w+))(?:\s*\[([^\]]+)\])?/g;
const refs = [];
while ((match = refRegex.exec(dbmlContent)) !== null) {
  const [_, t1, rawC1, op, t2, rawC2, optStr] = match;
  const parseCols = (str) => str.replace(/[()]/g, '').split(',').map(s => s.trim()).filter(Boolean);
  const cols1 = parseCols(rawC1);
  const cols2 = parseCols(rawC2);
  let onDelete = 'NO ACTION';
  if (optStr) {
    if (optStr.includes('delete: cascade')) onDelete = 'CASCADE';
    else if (optStr.includes('delete: set null')) onDelete = 'SET NULL';
    else if (optStr.includes('delete: restrict')) onDelete = 'RESTRICT';
  }
  refs.push({ fromTable: t1, fromCols: cols1, op, toTable: t2, toCols: cols2, onDelete });
}

// 4. Generate PostgreSQL DDL
let sql = `-- =============================================================================\n`;
sql += `-- MARK2 ENTERPRISE CLUSTER - CRM SERVICE PRODUCTION DATABASE SCHEMA (POSTGRESQL 15+)\n`;
sql += `-- Generated from Authoritative DBML: docs/crm/crm_final.dbml\n`;
sql += `-- Architecture: Multi-Tenant Tenant Isolation, Indian Statutory Compliance (GST/PAN/DPDP)\n`;
sql += `-- =============================================================================\n\n`;

sql += `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";\n`;
sql += `CREATE EXTENSION IF NOT EXISTS "pgcrypto";\n\n`;

// Generate Enums
sql += `-- =============================================================================\n`;
sql += `-- ENUM TYPE DEFINITIONS (${enums.length} Enums)\n`;
sql += `-- =============================================================================\n\n`;

enums.forEach(e => {
  sql += `CREATE TYPE ${e.name} AS ENUM (\n`;
  sql += e.values.map(v => `  '${v}'`).join(',\n');
  sql += `\n);\n\n`;
});

// Generate Tables
sql += `-- =============================================================================\n`;
sql += `-- TABLE DEFINITIONS (${tables.length} Tables)\n`;
sql += `-- =============================================================================\n\n`;

tables.forEach(t => {
  sql += `-- Table: ${t.name}\n`;
  sql += `CREATE TABLE ${t.name} (\n`;

  const colDefs = [];
  const tableConstraints = [];

  t.columns.forEach(c => {
    let typeSql = c.type;
    // Map DBML/custom types to Postgres
    if (typeSql.toLowerCase() === 'datetime') typeSql = 'TIMESTAMP WITHOUT TIME ZONE';
    if (typeSql.toLowerCase() === 'timestamp') typeSql = 'TIMESTAMP WITHOUT TIME ZONE';

    let colStr = `  ${c.name} ${typeSql}`;

    if (c.defaultValue) {
      colStr += ` DEFAULT ${c.defaultValue}`;
    }

    if (c.notNull || c.isPk) {
      colStr += ` NOT NULL`;
    }

    if (c.isPk) {
      colStr += ` PRIMARY KEY`;
    }

    if (c.isUnique) {
      colStr += ` UNIQUE`;
    }

    colDefs.push(colStr);
  });

  // Table-level PK from indexes
  const pkIdx = t.indexes.find(idx => idx.isPk);
  if (pkIdx) {
    tableConstraints.push(`  CONSTRAINT pk_${t.name} PRIMARY KEY (${pkIdx.cols.join(', ')})`);
  }

  // Table-level unique constraints
  const uniqueIdxs = t.indexes.filter(idx => idx.isUnique && idx.indexName);
  uniqueIdxs.forEach(idx => {
    tableConstraints.push(`  CONSTRAINT ${idx.indexName} UNIQUE (${idx.cols.join(', ')})`);
  });

  const allLines = [...colDefs, ...tableConstraints];
  sql += allLines.join(',\n');
  sql += `\n);\n\n`;

  if (t.note) {
    sql += `COMMENT ON TABLE ${t.name} IS '${t.note.replace(/'/g, "''")}';\n\n`;
  }
});

// Generate Secondary Indexes
sql += `-- =============================================================================\n`;
sql += `-- SECONDARY INDEX DEFINITIONS\n`;
sql += `-- =============================================================================\n\n`;

let indexCount = 0;
tables.forEach(t => {
  const nonPkNonUniqueIndexes = t.indexes.filter(idx => !idx.isPk && !idx.isUnique);
  nonPkNonUniqueIndexes.forEach(idx => {
    const idxName = idx.indexName || `idx_${t.name}_${idx.cols.join('_')}`;
    sql += `CREATE INDEX ${idxName} ON ${t.name} (${idx.cols.join(', ')});\n`;
    indexCount++;
  });
});
sql += `\n`;

// Generate Foreign Key Constraints
sql += `-- =============================================================================\n`;
sql += `-- FOREIGN KEY CONSTRAINTS (${refs.length} References)\n`;
sql += `-- =============================================================================\n\n`;

refs.forEach((r, idx) => {
  const fkName = `fk_${r.fromTable}_${r.fromCols.join('_')}_${idx + 1}`;
  sql += `ALTER TABLE ${r.fromTable}\n`;
  sql += `  ADD CONSTRAINT ${fkName}\n`;
  sql += `  FOREIGN KEY (${r.fromCols.join(', ')})\n`;
  sql += `  REFERENCES ${r.toTable} (${r.toCols.join(', ')})\n`;
  if (r.onDelete !== 'NO ACTION') {
    sql += `  ON DELETE ${r.onDelete};\n\n`;
  } else {
    sql += `;\n\n`;
  }
});

fs.writeFileSync('docs/crm/crm_postgres.sql', sql, 'utf8');
fs.writeFileSync('docs/crm/final-audit/crm_postgres.sql', sql, 'utf8');
console.log('Successfully generated docs/crm/crm_postgres.sql and docs/crm/final-audit/crm_postgres.sql');
console.log(`Enums: ${enums.length}, Tables: ${tables.length}, Secondary Indexes: ${indexCount}, Foreign Keys: ${refs.length}`);

