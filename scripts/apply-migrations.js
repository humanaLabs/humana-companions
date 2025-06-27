const { migrate } = require('drizzle-orm/postgres-js/migrator');
const postgres = require('postgres');
const { drizzle } = require('drizzle-orm/postgres-js');
require('dotenv').config();

const connectionString = process.env.POSTGRES_URL;
if (!connectionString) {
  console.error('POSTGRES_URL não definida no .env');
  process.exit(1);
}

const client = postgres(connectionString, { max: 1 });
const db = drizzle(client);

(async () => {
  try {
    await migrate(db, { migrationsFolder: './lib/db/migrations' });
    console.log('Migrations aplicadas com sucesso!');
    process.exit(0);
  } catch (err) {
    console.error('Erro ao aplicar migrations:', err);
    process.exit(1);
  }
})();
