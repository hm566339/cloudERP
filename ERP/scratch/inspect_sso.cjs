const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: 'postgresql://postgres:mohit@localhost:5432/sso'
  });

  try {
    await client.connect();

    const userRoles = await client.query(`
      SELECT u.email, r.name as role_name, c.company_name
      FROM user_role ur
      JOIN "user" u ON ur.user_id = u.id
      JOIN role r ON ur.role_id = r.id
      LEFT JOIN company c ON r.company_id = c.id
    `);
    console.log('\n--- USER ROLES ---');
    console.table(userRoles.rows);

    const modules = await client.query('SELECT id, name, module_status FROM module');
    console.log('\n--- MODULES ---');
    console.table(modules.rows);

    const compModules = await client.query(`
      SELECT cm.id, c.company_name, m.name as module_name, cm.active
      FROM company_module cm
      JOIN company c ON cm.company_id = c.id
      JOIN module m ON cm.module_id = m.id
    `);
    console.log('\n--- COMPANY MODULES ---');
    console.table(compModules.rows);

    const upa = await client.query(`
      SELECT u.email, c.company_name, m.name as module_name, upa.status
      FROM user_portal_access upa
      JOIN "user" u ON upa.user_id = u.id
      JOIN company_module cm ON upa.company_module_id = cm.id
      JOIN company c ON cm.company_id = c.id
      JOIN module m ON cm.module_id = m.id
    `);
    console.log('\n--- USER PORTAL ACCESS ---');
    console.table(upa.rows);

    const rolePermCounts = await client.query(`
      SELECT r.name, c.company_name, count(rp.feature_permission_id) as perm_count
      FROM role r
      LEFT JOIN company c ON r.company_id = c.id
      LEFT JOIN role_permission rp ON r.id = rp.role_id
      GROUP BY r.id, r.name, c.company_name
    `);
    console.log('\n--- ROLE PERMISSION COUNTS ---');
    console.table(rolePermCounts.rows);

    const features = await client.query(`SELECT DISTINCT module_name FROM feature`);
    console.log('\n--- DISTINCT FEATURE MODULE_NAMES ---');
    console.table(features.rows);

    const fpCounts = await client.query(`
      SELECT f.module_name, count(fp.id) as count
      FROM feature f
      JOIN feature_permission fp ON fp.feature_id = f.id
      GROUP BY f.module_name
    `);
    console.log('\n--- FEATURE PERMISSION COUNTS BY MODULE ---');
    console.table(fpCounts.rows);

  } catch (err) {
    console.error('Database query error:', err);
  } finally {
    await client.end();
  }
}

main();
