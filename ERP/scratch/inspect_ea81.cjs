const { Client } = require('pg');

async function run() {
  const client = new Client({ connectionString: 'postgresql://postgres:mohit@localhost:5432/postgres' });
  await client.connect();
  const res = await client.query('SELECT datname FROM pg_database WHERE datistemplate = false');
  console.log('DATABASES:', res.rows.map(r => r.datname));
  await client.end();
}

run().catch(console.error);
