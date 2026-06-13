const express = require('express');
const multer = require('multer');
const path = require('path');
const pool = require('../db');
const { authenticate, requirePermission } = require('../middlewares/auth');

const exerciseStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'uploads', 'exercises')),
  filename: (req, file, cb) => cb(null, `exercise_${Date.now()}${path.extname(file.originalname)}`)
});
const upload = multer({ storage: exerciseStorage, limits: { fileSize: 20 * 1024 * 1024 } });

const router = express.Router();
router.use(authenticate);

router.get('/', requirePermission('courses:read'), async (req, res) => {
  try {
    const { niveau, classe } = req.query;
    const conditions = [];
    const params = [];
    let idx = 1;

    if (niveau) { conditions.push(`e.niveau = $${idx}`); params.push(niveau); idx++; }
    if (classe) { conditions.push(`e.classe = $${idx}`); params.push(classe); idx++; }

    if (req.user.dbRole === 'enseignant') {
      conditions.push(`e.teacher_id = $${idx}`); params.push(req.user.id); idx++;
    } else {
      conditions.push(`e.status = 'published'`);
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const result = await pool.query(
      `SELECT e.*, u.nom AS teacher_nom, u.prenom AS teacher_prenom
       FROM exercises e
       LEFT JOIN users u ON u.id = e.teacher_id
       ${whereClause}
       ORDER BY e.created_at DESC`,
      params
    );
    res.json({ data: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', requirePermission('courses:manage'), async (req, res) => {
  const { subject, niveau, classe, title, description, content, file_url, video_url, status, due_date } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO exercises (teacher_id, subject, niveau, classe, title, description, content, file_url, video_url, status, due_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [req.user.id, subject, niveau, classe, title, description || '', content || '', file_url || '', video_url || '', status || 'draft', due_date || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', requirePermission('courses:manage'), async (req, res) => {
  const { id } = req.params;
  const { title, description, content, file_url, video_url, status, due_date } = req.body;
  try {
    let query = `UPDATE exercises SET title = $1, description = $2, content = $3`;
    const params = [title, description || '', content || ''];
    let idx = 4;

    if (file_url !== undefined) { query += `, file_url = $${idx}`; params.push(file_url); idx++; }
    if (video_url !== undefined) { query += `, video_url = $${idx}`; params.push(video_url); idx++; }
    if (status !== undefined) { query += `, status = $${idx}`; params.push(status); idx++; }
    if (due_date !== undefined) { query += `, due_date = $${idx}`; params.push(due_date); idx++; }

    query += ` WHERE id = $${idx}`;
    params.push(id);

    if (req.user.dbRole === 'enseignant') {
      idx++;
      query += ` AND teacher_id = $${idx}`;
      params.push(req.user.id);
    }

    query += ' RETURNING *';
    const result = await pool.query(query, params);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Exercice non trouvé' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/upload', requirePermission('courses:manage'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Aucun fichier fourni' });
    res.json({ file_url: `/uploads/exercises/${req.file.filename}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', requirePermission('courses:manage'), async (req, res) => {
  const { id } = req.params;
  try {
    let query = 'DELETE FROM exercises WHERE id = $1';
    const params = [id];
    if (req.user.dbRole === 'enseignant') {
      query += ' AND teacher_id = $2';
      params.push(req.user.id);
    }
    query += ' RETURNING id';
    const result = await pool.query(query, params);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Exercice non trouvé' });
    }
    res.json({ success: true, id: parseInt(id) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
