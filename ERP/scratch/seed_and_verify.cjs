const { Client } = require('pg');

async function run() {
  const client = new Client({ connectionString: 'postgresql://postgres:mohit@localhost:5432/sso' });
  await client.connect();

  console.log('--- 1. GET CANONICAL MODULES ---');
  const allMods = await client.query("SELECT id, name, host, module_status FROM module WHERE UPPER(name) IN ('ACCOUNT', 'INVENTORY', 'WORKFLOW')");
  console.table(allMods.rows);
  const accMod = allMods.rows.find(m => m.name.toUpperCase() === 'ACCOUNT');
  const invMod = allMods.rows.find(m => m.name.toUpperCase() === 'INVENTORY');
  const wfMod = allMods.rows.find(m => m.name.toUpperCase() === 'WORKFLOW');

  console.log('--- 2. GET COMPANY MOHIT ---');
  const mohitComp = await client.query("SELECT id, company_name, company_code FROM company WHERE UPPER(company_code) = 'MOHIT'");
  console.table(mohitComp.rows);
  const cid = mohitComp.rows[0].id;

  console.log('--- 3. ASSIGN MODULES TO MOHIT ---');
  for (const mod of [accMod, invMod, wfMod]) {
    if (!mod) continue;
    const cmCheck = await client.query('SELECT * FROM company_module WHERE company_id = $1 AND module_id = $2', [cid, mod.id]);
    if (cmCheck.rows.length === 0) {
      await client.query(`
        INSERT INTO company_module (id, company_id, module_id, active, created_at, updated_at)
        VALUES (gen_random_uuid(), $1, $2, true, NOW(), NOW())
      `, [cid, mod.id]);
      console.log(`Assigned module ${mod.name} (${mod.id}) to company ${cid}`);
    } else if (!cmCheck.rows[0].active) {
      await client.query('UPDATE company_module SET active = true, updated_at = NOW() WHERE id = $1', [cmCheck.rows[0].id]);
      console.log(`Reactivated module ${mod.name} (${mod.id}) for company ${cid}`);
    } else {
      console.log(`Module ${mod.name} (${mod.id}) is already active for company ${cid}`);
    }
  }

  console.log('--- 4. VERIFY FINAL COMPANY_MODULE ASSIGNMENTS ---');
  const finalCms = await client.query(`
    SELECT cm.id, cm.company_id, c.company_code, cm.module_id, m.name as module_name, m.host, cm.active
    FROM company_module cm
    JOIN company c ON cm.company_id = c.id
    JOIN module m ON cm.module_id = m.id
    WHERE cm.company_id = $1
  `, [cid]);
  console.table(finalCms.rows);

  await client.end();
}

run().catch(console.error);
