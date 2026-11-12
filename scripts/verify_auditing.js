const fs = require('fs');
const content = fs.readFileSync('docs/crm/crm_final.dbml', 'utf8');

const tableRegex = /Table\s+(\w+)\s+{([^}]+)}/g;
const auditReport = [];

const auditFields = [
  'created_at', 'updated_at', 'created_by', 'created_by_username',
  'updated_by', 'updated_by_username', 'is_deleted', 'deleted_by',
  'deleted_by_username', 'deleted_at'
];

while ((match = tableRegex.exec(content)) !== null) {
  const tableName = match[1];
  const body = match[2];
  const missing = auditFields.filter(f => !body.includes(f));
  auditReport.push({
    tableName,
    missingCount: missing.length,
    missingFields: missing
  });
}

const partialAudit = auditReport.filter(r => r.missingCount > 0);
console.log(JSON.stringify(partialAudit, null, 2));
