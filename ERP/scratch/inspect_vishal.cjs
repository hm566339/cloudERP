const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: 'postgresql://postgres:mohit@localhost:5432/sso'
  });

  try {
    await client.connect();

    const vishal = await client.query(`SELECT id, email, username, password FROM "user" WHERE email = 'vishal@gmail.com'`);
    console.log('Vishal user:', vishal.rows);

    const sessions = await client.query(`
      SELECT s.id, s.user_id, s.company_id, s.module_id, m.name as module_name, c.company_name, s.access_token_valid_till, s.created_at
      FROM session s
      LEFT JOIN module m ON s.module_id = m.id
      LEFT JOIN company c ON s.company_id = c.id
      WHERE s.user_id = $1
      ORDER BY s.created_at DESC
      LIMIT 10
    `, [vishal.rows[0]?.id]);
    console.log('\n--- VISHAL SESSIONS ---');
    console.table(sessions.rows);

  } catch (err) {
    console.error('Database query error:', err);
  } finally {
    await client.end();
  }
}

main();
