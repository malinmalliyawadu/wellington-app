import { readFileSync } from 'fs';
import pg from 'pg';

const file = process.argv[2];
if (!file) {
  console.error('Usage: node supabase/run-sql.mjs <file.sql>');
  process.exit(1);
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('DATABASE_URL is not set. Add it to your .env file.');
  process.exit(1);
}

const sql = readFileSync(file, 'utf-8');
const client = new pg.Client({ connectionString: databaseUrl });

try {
  await client.connect();
  console.log(`Running ${file}...`);
  await client.query(sql);
  console.log('Done.');
} catch (err) {
  console.error('Error:', err.message);
  process.exit(1);
} finally {
  await client.end();
}
