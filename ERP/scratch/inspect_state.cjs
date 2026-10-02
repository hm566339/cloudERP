const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: 'postgresql://postgres:mohit@localhost:5432/sso'
  });

  try {
    await client.connect();

    console.log('--- USERS WITH VISHAL ---');
    const users = await client.query('SELECT id, username, email, full_name, account_status, email_status FROM "user" WHERE username ILIKE \'%vishal%\' OR email ILIKE \'%vishal%\'');
    console.table(users.rows);

    const vishalUser = users.rows[0];
    if (vishalUser) {
      console.log('--- VISHAL USER ROLES ---');
      const ur = await client.query(`
        SELECT ur.user_id, r.name as role_name, r.id as role_id, r.company_id, c.company_code
        FROM user_role ur
        JOIN role r ON ur.role_id = r.id
        LEFT JOIN company c ON r.company_id = c.id
        WHERE ur.user_id = $1
      `, [vishalUser.id]);
      console.table(ur.rows);

      console.log('--- VISHAL ORG MEMBERSHIP ---');
      const om = await client.query(`
        SELECT om.id, om.organization_id, o.organization_code, om.member_type, om.membership_status
        FROM organization_member om
        JOIN organization o ON om.organization_id = o.id
        WHERE om.user_id = $1
      `, [vishalUser.id]);
      console.table(om.rows);

      console.log('--- VISHAL MEMBER COMPANY ACCESS ---');
      const mca = await client.query(`SELECT * FROM member_company_access LIMIT 5`);
      console.table(mca.rows);

      console.log('--- VISHAL COMPANY MODULES ---');
      const cm = await client.query(`
        SELECT cm.id, cm.company_id, c.company_code, m.id as module_id, m.name as module_name, cm.active
        FROM company_module cm
        JOIN company c ON cm.company_id = c.id
        JOIN module m ON cm.module_id = m.id
        WHERE c.company_code = 'VISHAL'
      `);
      console.table(cm.rows);

      console.log('--- VISHAL SUBSCRIPTION ---');
      const subs = await client.query(`
        SELECT s.id, s.organization_id, s.status, s.plan_code, s.access_mode, s.trial_started_at, s.trial_ends_at
        FROM subscription s
        WHERE s.organization_id = $1
      `, [om.rows[0]?.organization_id]);
      console.table(subs.rows);

      console.log('--- VISHAL ROLE PERMISSIONS ---');
      const rp = await client.query(`
        SELECT r.name as role_name, fp.permission_code, f.module_name, fp.active as perm_active, f.active as feature_active
        FROM role_permission rp
        JOIN role r ON rp.role_id = r.id
        JOIN feature_permission fp ON rp.feature_permission_id = fp.id
        JOIN feature f ON fp.feature_id = f.id
        WHERE r.name = 'OWNER' AND r.company_id = 'ff808d58-4bd6-4036-9642-03c6212b48f3'
      `);
      console.log('Total OWNER permissions for VISHAL company:', rp.rows.length);
      console.table(rp.rows.slice(0, 20));
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

main();
