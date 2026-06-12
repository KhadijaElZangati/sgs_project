const express = require('express');
const multer = require('multer');
const path = require('path');
const pool = require('../db');
const bcrypt = require('bcryptjs');
const { authenticate } = require('../middlewares/auth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'uploads', 'profiles')),
  filename: (req, file, cb) => cb(null, `photo_${req.user?.id || 'unknown'}_${Date.now()}${path.extname(file.originalname)}`)
});
const upload = multer({ storage, limits: { fileSize: 2 * 1024 * 1024 } });

const router = express.Router();

// --- Profile (self) ---

router.get('/profile', authenticate, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Utilisateur non trouvé' });
    const u = result.rows[0];
    delete u.password;
    res.json(u);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/profile', authenticate, async (req, res) => {
  try {
    const allowed = ['nom','prenom','email','telephone','adresse','date_naissance','lieu_naissance','cin','cnss','poste','matricule','diplome','specialite','sexe'];
    const fields = [];
    const params = [];
    let idx = 1;
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        fields.push(`${key} = $${idx++}`);
        params.push(req.body[key]);
      }
    }
    if (req.body.password) {
      const hashed = await bcrypt.hash(req.body.password, 10);
      fields.push(`password = $${idx++}`);
      params.push(hashed);
    }
    if (fields.length === 0) return res.status(400).json({ error: 'Aucun champ à mettre à jour' });
    params.push(req.user.id);
    const result = await pool.query(`UPDATE users SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`, params);
    const u = result.rows[0];
    delete u.password;
    res.json(u);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Cet email existe déjà' });
    res.status(500).json({ error: err.message });
  }
});

router.post('/profile/photo', authenticate, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Aucun fichier fourni' });
    const photoPath = `/uploads/profiles/${req.file.filename}`;
    await pool.query('UPDATE users SET photo = $1 WHERE id = $2', [photoPath, req.user.id]);
    res.json({ photo: photoPath });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Admin: list all users ---

router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    const role = req.query.role || '';

    const conditions = [];
    const params = [];
    let idx = 1;

    if (search) {
      conditions.push(`(nom ILIKE $${idx} OR prenom ILIKE $${idx} OR email ILIKE $${idx})`);
      params.push(`%${search}%`);
      idx++;
    }
    if (role) {
      conditions.push(`role = $${idx}`);
      params.push(role);
      idx++;
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
    const countResult = await pool.query(`SELECT COUNT(*)::int AS count FROM users ${whereClause}`, params);
    const total = countResult.rows[0].count;

    const result = await pool.query(
      `SELECT * FROM users ${whereClause} ORDER BY nom ASC LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limit, offset]
    );

    res.json({ data: result.rows, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ data: [], total: 0, page: 1, limit: 20, totalPages: 0 });
  }
});

// --- Admin: update any user ---

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const allowed = ['nom','prenom','email','role','actif','telephone','adresse','date_naissance','lieu_naissance','cin','cnss','poste','matricule','diplome','specialite','sexe'];
    const fields = [];
    const params = [];
    let idx = 1;

    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        fields.push(`${key} = $${idx++}`);
        params.push(req.body[key]);
      }
    }
    if (req.body.password) {
      const hashed = await bcrypt.hash(req.body.password, 10);
      fields.push(`password = $${idx++}`);
      params.push(hashed);
    }

    if (fields.length === 0) return res.status(400).json({ error: 'Aucun champ à mettre à jour' });

    params.push(id);
    const result = await pool.query(`UPDATE users SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`, params);

    if (result.rows.length === 0) return res.status(404).json({ error: 'Utilisateur non trouvé' });

    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Cet email existe déjà' });
    res.status(500).json({ error: err.message });
  }
});

// --- Admin: delete user ---

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Utilisateur non trouvé' });
    res.json({ message: 'Utilisateur supprimé' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
