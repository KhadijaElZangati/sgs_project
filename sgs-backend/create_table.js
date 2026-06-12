const { Pool } = require('pg');
const pool = new Pool({user:'sgs_admin',host:'localhost',database:'sgs_db',password:'sgs_pass_2026',port:5432});
(async () => {
  try {
    await pool.query('CREATE TABLE IF NOT EXISTS absence_records (id SERIAL PRIMARY KEY, eleve_id INTEGER REFERENCES eleves(id) ON DELETE CASCADE, date DATE NOT NULL DEFAULT CURRENT_DATE, justifie BOOLEAN DEFAULT false, motif TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)');
    console.log('OK table absence_records created');
  } catch(e) {
    console.error('Error: ' + e.message);
  } finally {
    await pool.end();
  }
})();
