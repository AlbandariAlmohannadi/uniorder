const fs = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DATABASE_URL || 'sqlite:database.sqlite',
  {
    logging: false
  }
);

async function runMigrations() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established.');

    const migrationFiles = fs.readdirSync(__dirname)
      .filter(file => file.endsWith('.js') && file !== 'index.js')
      .sort();

    for (const file of migrationFiles) {
      console.log(`Running migration: ${file}`);
      const migration = require(path.join(__dirname, file));
      await migration.up(sequelize.getQueryInterface(), Sequelize);
      console.log(`Completed migration: ${file}`);
    }

    console.log('All migrations completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

module.exports = { up: runMigrations };

if (require.main === module) {
  runMigrations();
}