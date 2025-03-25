require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { sequelize } = require('../utils/database');

async function checkTables() {
  try {
    // Check teams table
    console.log('\nTeams Table Structure:');
    const teamsColumns = await sequelize.query('SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name = \'teams\'');
    console.log(JSON.stringify(teamsColumns[0], null, 2));

    // Check players table
    console.log('\nPlayers Table Structure:');
    const playersColumns = await sequelize.query('SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name = \'players\'');
    console.log(JSON.stringify(playersColumns[0], null, 2));

    // Check tournaments table
    console.log('\nTournaments Table Structure:');
    const tournamentsColumns = await sequelize.query('SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name = \'tournaments\'');
    console.log(JSON.stringify(tournamentsColumns[0], null, 2));

    // Check earnings table
    console.log('\nEarnings Table Structure:');
    const earningsColumns = await sequelize.query('SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name = \'earnings\'');
    console.log(JSON.stringify(earningsColumns[0], null, 2));

    // Check indexes
    console.log('\nIndexes:');
    const indexes = await sequelize.query(`
      SELECT
        t.relname AS table_name,
        i.relname AS index_name,
        a.attname AS column_name,
        ix.indisunique AS is_unique
      FROM
        pg_class t,
        pg_class i,
        pg_index ix,
        pg_attribute a
      WHERE
        t.oid = ix.indrelid
        AND i.oid = ix.indexrelid
        AND a.attrelid = t.oid
        AND a.attnum = ANY(ix.indkey)
        AND t.relkind = 'r'
        AND t.relname IN ('teams', 'players', 'tournaments', 'earnings')
      ORDER BY
        t.relname,
        i.relname;
    `);
    console.log(JSON.stringify(indexes[0], null, 2));

    // Check foreign keys
    console.log('\nForeign Keys:');
    const foreignKeys = await sequelize.query(`
      SELECT
        tc.table_schema, 
        tc.table_name, 
        kcu.column_name,
        ccu.table_schema AS foreign_table_schema,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name IN ('teams', 'players', 'tournaments', 'earnings');
    `);
    console.log(JSON.stringify(foreignKeys[0], null, 2));

    await sequelize.close();
  } catch (error) {
    console.error('Error checking tables:', error);
    process.exit(1);
  }
}

checkTables(); 