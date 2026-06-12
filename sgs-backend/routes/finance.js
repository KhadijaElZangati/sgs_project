const express = require('express');
const pool = require('../db');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    const type = req.query.type || '';
    const dateFrom = req.query.dateFrom || '';
    const dateTo = req.query.dateTo || '';

    const conditions = [];
    const params = [];
    let idx = 1;

    if (search) {
      conditions.push(`(description ILIKE $${idx} OR categorie ILIKE $${idx})`);
      params.push(`%${search}%`);
      idx++;
    }
    if (type) {
      conditions.push(`type = $${idx}`);
      params.push(type);
      idx++;
    }
    if (dateFrom) {
      conditions.push(`date >= $${idx}`);
      params.push(dateFrom);
      idx++;
    }
    if (dateTo) {
      conditions.push(`date <= $${idx}`);
      params.push(dateTo);
      idx++;
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
    const countResult = await pool.query(`SELECT COUNT(*)::int AS count FROM operations ${whereClause}`, params);
    const total = countResult.rows[0].count;

    const result = await pool.query(
      `SELECT * FROM operations ${whereClause} ORDER BY date DESC LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limit, offset]
    );

    res.json({ data: result.rows, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.json({ data: [], total: 0, page: 1, limit: 20, totalPages: 0 });
  }
});

router.post('/', async (req, res) => {
  const { type, categorie, description, montant, date } = req.body;
  const saisie_par = req.user?.id || req.body.saisie_par;
  try {
    await pool.query(
      'INSERT INTO operations (type, categorie, description, montant, date, saisie_par, statut) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [type, categorie, description, montant, date, saisie_par, 'valide']
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
