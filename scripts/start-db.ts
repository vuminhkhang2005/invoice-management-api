import { ensurePostgresServer } from '../src/config/embeddedDb';

async function main() {
  await ensurePostgresServer(5432);
  console.log('🐘 PostgreSQL is up and ready for database operations!');
}

main().catch((err) => {
  console.error('Failed to start PostgreSQL:', err);
  process.exit(1);
});
