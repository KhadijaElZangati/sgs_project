const express = require('express');
const pool = require('../db');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    const statut = req.query.statut || '';
    const userId = req.query.userId || '';

    const conditions = [];
    const params = [];
    let idx = 1;

    if (search) {
      conditions.push(`(u.prenom ILIKE $${idx} OR u.nom ILIKE $${idx} OR d.type ILIKE $${idx})`);
      params.push(`%${search}%`);
      idx++;
    }
    if (statut) {
      conditions.push(`d.statut = $${idx}`);
      params.push(statut);
      idx++;
    }
    if (userId) {
      conditions.push(`d.employe_id = $${idx}`);
      params.push(parseInt(userId));
      idx++;
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const countResult = await pool.query(`
      SELECT COUNT(*)::int AS count
      FROM demandes_rh d LEFT JOIN users u ON d.employe_id = u.id
      ${whereClause}
    `, params);
    const total = countResult.rows[0].count;

    const result = await pool.query(`
      SELECT d.*, u.prenom AS employe_prenom, u.nom AS employe_nom
      FROM demandes_rh d LEFT JOIN users u ON d.employe_id = u.id
      ${whereClause}
      ORDER BY d.id DESC LIMIT $${idx} OFFSET $${idx + 1}
    `, [...params, limit, offset]);

    res.json({ data: result.rows, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.json({ data: [], total: 0, page: 1, limit: 20, totalPages: 0 });
  }
});

router.post('/', async (req, res) => {
  const { type, date_debut, date_fin, motif, employe_id } = req.body;
  try {
    await pool.query(
      'INSERT INTO demandes_rh (type, date_debut, date_fin, motif, employe_id, statut) VALUES ($1, $2, $3, $4, $5, $6)',
      [type, date_debut || null, date_fin || null, motif, employe_id, 'en attente']
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { statut, commentaire } = req.body;
  try {
    await pool.query(
      'UPDATE demandes_rh SET statut = $1, commentaire = $2 WHERE id = $3',
      [statut, commentaire || null, id]
    );

    const reqResult = await pool.query('SELECT employe_id, type FROM demandes_rh WHERE id = $1', [id]);
    if (reqResult.rows.length > 0) {
      const { employe_id, type } = reqResult.rows[0];
      const reqType = type.replace("_", " ");
      const message = `Votre demande de ${reqType} a été ${statut}.`;
      await pool.query(
        'INSERT INTO notifications (user_id, type, message, temps, lu) VALUES ($1, $2, $3, NOW(), false)',
        [employe_id, 'Mise à jour RH', message]
      );
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
