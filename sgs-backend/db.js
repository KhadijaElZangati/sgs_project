const { Pool } = require('pg');

const pool = new Pool({
  user: 'sgs_admin',
  host: 'localhost',
  database: 'sgs_db',
  password: 'sgs_pass_2026',
  port: 5432,
});

module.exports = pool;
