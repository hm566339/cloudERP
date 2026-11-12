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
    const idxMatch = line.match(/^(\([^\)]+\)|[^\s\[]+)\s*(\[([^\]]+)\])?/);
    if (idxMatch) {
      const colsRaw = idxMatch[1].replace(/[()]/g, '');
      const cols = colsRaw.split(',').map(s => s.trim()).filter(Boolean);
      const propsStr = idxMatch[3] || '';
      const isPk = propsStr.includes('pk');
      const isUnique = propsStr.includes('unique');
      const nameMatch = propsStr.match(/name:\s*'([^']+)'/);
      const indexName = nameMatch ? nameMatch[1] : (isPk ? `pk_${currentTable}` : `idx_${currentTable}_${cols.join('_')}`);

      indexList.push({
        table: currentTable,
        name: indexName,
        cols,
        colsStr: cols.join(', '),
        isPk,
        isUnique,
        companyIdLeading: cols[0] === 'company_id',
        hasCompanyId: cols.includes('company_id')
      });
    }
  } else if (line === '}' && !inIndexes) {
    currentTable = null;
  }
}

console.log(`Extracted ${indexList.length} indexes.`);

function determineDetails(idx) {
  const { table, name, cols, companyIdLeading, isPk, isUnique } = idx;
  let pattern = '';
  let redundant = 'No';
  let missing = 'None';
  let action = 'Retain';

  // Specific query pattern classification
  if (isPk) {
    pattern = 'Primary key entity identity & record lookup';
  } else if (name === 'idx_crm_outbox_status_attempt') {
    pattern = 'Cross-tenant background worker polling queue (`WHERE status = PENDING AND next_attempt_at <= NOW()`)';
    action = 'Retain (Keep status leading; DO NOT add company_id leading to avoid partition hopping)';
  } else if (name === 'idx_crm_webhook_status_retry') {
    pattern = 'Asynchronous webhook retry worker queue polling';
    action = 'Retain (Keep processing_status leading for worker queue efficiency)';
  } else if (name === 'idx_crm_msg_delivery_status') {
    pattern = 'Cross-tenant outbound message dispatch queue';
    action = 'Retain (Keep delivery_status leading for worker dispatcher)';
  } else if (name === 'idx_crm_task_reminder') {
    pattern = 'Cross-tenant scheduled reminder worker daemon';
    action = 'Retain (Keep status leading for worker daemon)';
  } else if (name === 'idx_crm_tint_status_enabled') {
    pattern = 'Global webhook routing & active connector health check';
    action = 'Retain';
  } else if (name === 'uq_crm_tint_webhook_slug') {
    pattern = 'External webhook callback URL slug resolution';
    action = 'Retain (Global unique constraint)';
  } else if (cols.length === 1 && cols[0].endsWith('_id') && !companyIdLeading) {
    pattern = 'Foreign key join traversal & parent cascade delete/set-null';
    action = 'Retain (Required for fast relational JOIN and CASCADE integrity)';
  } else if (name.startsWith('uq_') || isUnique) {
    if (cols.includes('id') && cols.includes('company_id')) {
      pattern = 'Composite parent key for tenant-safe composite foreign key targets';
    } else {
      pattern = 'Tenant-scoped natural business key uniqueness enforcement';
    }
    action = 'Retain';
  } else if (companyIdLeading) {
    if (cols.includes('created_at') || cols.includes('last_message_at') || cols.includes('activity_at')) {
      pattern = 'Tenant-filtered chronological range query & cursor pagination';
    } else if (cols.includes('entity_type') && cols.includes('entity_id')) {
      pattern = 'Tenant-filtered polymorphic entity activity/timeline retrieval';
    } else if (cols.includes('owner_user_id') || cols.includes('assigned_to_user_id') || cols.includes('to_user_id')) {
      pattern = 'Tenant-filtered user ownership & assignment queue filtering';
    } else if (cols.includes('normalized_phone') || cols.includes('normalized_email')) {
      pattern = 'Tenant-filtered deduplication & fast communication contact search';
    } else {
      pattern = 'Tenant-filtered operational search & index range scan';
    }
    action = 'Retain';
  } else {
    pattern = 'Relational lookups & secondary filtering';
  }

  // Redundancy check: is this index an exact left-prefix of another index on the same table?
  // (Ignoring single-column PKs or composite unique requirements)
  return { pattern, redundant, missing, action };
}

const auditRows = indexList.map((idx, i) => {
  const details = determineDetails(idx);
  return {
    num: i + 1,
    table: idx.table,
    name: idx.name,
    cols: idx.colsStr,
    companyLeading: idx.companyIdLeading ? 'Yes' : 'No',
    pattern: details.pattern,
    redundant: details.redundant,
    missing: details.missing,
    action: details.action
  };
});

fs.writeFileSync('scripts/index_audit_data.json', JSON.stringify(auditRows, null, 2), 'utf8');
console.log('Saved index audit data to scripts/index_audit_data.json');

