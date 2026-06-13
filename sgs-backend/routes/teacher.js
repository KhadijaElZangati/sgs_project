const express = require('express');
const pool = require('../db');
const { authenticate, requirePermission } = require('../middlewares/auth');

const router = express.Router();
router.use(authenticate);

router.get('/assignments', requirePermission('courses:read'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, subject, niveau, classe FROM teacher_assignments WHERE user_id = $1 ORDER BY niveau, classe`,
      [req.user.id]
    );
    const subjectResult = await pool.query('SELECT subject FROM users WHERE id = $1', [req.user.id]);
    const subject = subjectResult.rows[0]?.subject || null;
    res.json({ assignments: result.rows, subject });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/eleves', requirePermission('students:read'), async (req, res) => {
  try {
    const assignments = await pool.query(
      `SELECT niveau, classe FROM teacher_assignments WHERE user_id = $1`,
      [req.user.id]
    );
    if (assignments.rows.length === 0) {
      return res.json({ data: [] });
    }
    const conditions = assignments.rows.map((a, i) =>
      `(niveau = $${i * 2 + 1} AND classe = $${i * 2 + 2})`
    ).join(' OR ');
    const params = assignments.rows.flatMap(a => [a.niveau, a.classe]);
    const result = await pool.query(
      `SELECT id, id_massar, nom, prenom, classe, niveau FROM eleves WHERE ${conditions} ORDER BY nom ASC`,
      params
    );
    res.json({ data: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
