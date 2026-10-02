const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: 'postgresql://postgres:mohit@localhost:5432/sso'
  });

  try {
    await client.connect();
    console.log('Connected to SSO database successfully');

    const orgs = await client.query('SELECT id, organization_code, display_name, status, access_mode FROM organizations');
    console.log('\n--- ORGANIZATIONS ---');
    console.table(orgs.rows);

    const users = await client.query('SELECT id, email, username, account_status, email_status FROM users LIMIT 10');
    console.log('\n--- USERS ---');
    console.table(users.rows);

    const members = await client.query(`
      SELECT m.id, o.organization_code, u.email, m.member_type, m.status 
      FROM organization_members m 
      JOIN organizations o ON m.organization_id = o.id 
      JOIN users u ON m.user_id = u.id
    `);
    console.log('\n--- MEMBERSHIPS ---');
    console.table(members.rows);

    const companies = await client.query('SELECT id, company_code, company_name, organization_id, active FROM companies');
    console.log('\n--- COMPANIES ---');
    console.table(companies.rows);

    const subs = await client.query('SELECT id, organization_id, status, plan_code, access_mode, trial_started_at, trial_ends_at FROM subscriptions');
    console.log('\n--- SUBSCRIPTIONS ---');
    console.table(subs.rows);

    const modules = await client.query('SELECT id, name, host, module_status FROM modules');
    console.log('\n--- MODULES ---');
    console.table(modules.rows);

  } catch (err) {
    console.error('Database query error:', err.message);
  } finally {
    await client.end();
  }
}

main();
console.log('--- MEMBER COMPANY ACCESS ---');
console.table(mcaRes.rows);

const orgModRes = await client.query("SELECT * FROM organization_module WHERE organization_id = $1", [org.id]);
console.log('--- VISHAL ORG MODULES ---');
console.table(orgModRes.rows);

const compModRes = await client.query("SELECT * FROM company_module WHERE company_id = $1", [compRes.rows[0]?.id]);
console.log('--- VISHAL COMPANY MODULES ---');
console.table(compModRes.rows);

const upaRes = await client.query("SELECT * FROM user_portal_access WHERE user_id = 'a9f19937-ca83-4382-b247-3688017af6dc'");
console.log('--- VISHAL USER PORTAL ACCESS ---');
console.table(upaRes.rows);

  } catch (err) {
  console.error('Error:', err.message);
} finally {
  await client.end();
}
}

main();
