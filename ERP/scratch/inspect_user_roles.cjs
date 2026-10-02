const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: 'postgresql://postgres:mohit@localhost:5432/sso'
  });

  try {
    await client.connect();

    const ur = await client.query(`
      SELECT u.id as user_id, u.email, r.id as role_id, r.name as role_name, r.company_id as role_company_id, c.company_name, c.company_code 
      FROM user_role ur 
      JOIN "user" u ON ur.user_id = u.id 
      JOIN role r ON ur.role_id = r.id 
      LEFT JOIN company c ON r.company_id = c.id
    `);
    console.table(ur.rows);

  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

main();
