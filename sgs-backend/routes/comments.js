const express = require('express');
const pool = require('../db');
const { authenticate } = require('../middlewares/auth');

const router = express.Router();
router.use(authenticate);

router.post('/', async (req, res) => {
  const { item_type, item_id, content, is_note } = req.body;
  if (!item_type || !item_id || !content?.trim()) {
    return res.status(400).json({ error: 'item_type, item_id et content requis' });
  }
  if (!['course', 'exercise'].includes(item_type)) {
    return res.status(400).json({ error: 'item_type doit être course ou exercise' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO item_comments (item_type, item_id, user_id, content, is_note)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [item_type, item_id, req.user.id, content.trim(), !!is_note]
    );
    const row = await pool.query(
      'SELECT u.nom, u.prenom FROM users u WHERE u.id = $1',
      [req.user.id]
    );
    const comment = result.rows[0];
    comment.user_nom = row.rows[0]?.nom || '';
    comment.user_prenom = row.rows[0]?.prenom || '';
    res.status(201).json(comment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:itemType/:itemId', async (req, res) => {
  const { itemType, itemId } = req.params;
  if (!['course', 'exercise'].includes(itemType)) {
    return res.status(400).json({ error: 'item_type doit être course ou exercise' });
  }
  try {
    const isTeacher = req.user.dbRole === 'enseignant';
    let query;
    if (isTeacher) {
      query = `SELECT c.*, u.nom, u.prenom FROM item_comments c JOIN users u ON u.id = c.user_id WHERE c.item_type = $1 AND c.item_id = $2 AND c.is_note = false ORDER BY c.created_at DESC`;
    } else {
      query = `SELECT c.*, u.nom, u.prenom FROM item_comments c JOIN users u ON u.id = c.user_id WHERE c.item_type = $1 AND c.item_id = $2 AND (c.is_note = false OR c.user_id = $3) ORDER BY c.created_at DESC`;
    }
    const params = isTeacher ? [itemType, itemId] : [itemType, itemId, req.user.id];
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM item_comments WHERE id = $1 AND user_id = $2 RETURNING id', [id, req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Commentaire non trouvé' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
