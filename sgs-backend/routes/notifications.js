const express = require('express');
const pool = require('../db');

const router = express.Router();

router.get('/user/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY temps DESC LIMIT 10',
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.json([]);
  }
});

router.put('/:id/read', async (req, res) => {
  try {
    await pool.query('UPDATE notifications SET lu = true WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
