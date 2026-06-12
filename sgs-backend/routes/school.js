const express = require('express');
const multer = require('multer');
const path = require('path');
const pool = require('../db');
const { sendAlertEmail } = require('../utils/email');
const { mapColumns, fallbackMapping } = require('../utils/aiMapping');
const { authenticate } = require('../middlewares/auth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'uploads', 'absences')),
  filename: (req, file, cb) => cb(null, `justif_${Date.now()}_${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`)
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';

    let whereClause = '';
    const params = [];
    if (search) {
      whereClause = 'WHERE nom ILIKE $1 OR prenom ILIKE $1 OR id_massar ILIKE $1';
      params.push(`%${search}%`);
    }

    const countResult = await pool.query(`SELECT COUNT(*)::int AS count FROM eleves ${whereClause}`, params);
    const total = countResult.rows[0].count;

    const orderClause = search
      ? `ORDER BY CASE WHEN nom ILIKE $${params.length + 1} THEN 0 ELSE 1 END, nom ASC`
      : 'ORDER BY nom ASC';
    if (search) params.push(`${search}%`);

    const result = await pool.query(
      `SELECT * FROM eleves ${whereClause} ${orderClause} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    res.json({ data: result.rows, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.json({ data: [], total: 0, page: 1, limit: 20, totalPages: 0 });
  }
});

router.get('/all', async (req, res) => {
  try {
    const eleves = await pool.query('SELECT * FROM eleves ORDER BY nom ASC');
    const resultats = await pool.query(`
      SELECT DISTINCT ON (massar_id, eleve_name) massar_id, eleve_name, niveau
      FROM resultats
      WHERE massar_id IS NOT NULL AND eleve_name IS NOT NULL
        AND massar_id NOT IN (SELECT COALESCE(id_massar, '') FROM eleves WHERE id_massar IS NOT NULL)
      ORDER BY massar_id, eleve_name
    `);

    const combined = [
      ...eleves.rows,
      ...resultats.rows.map((r, i) => {
        const parts = (r.eleve_name || '').trim().split(/\s+/);
        return {
          id: `r_${i + 1}`,
          id_massar: r.massar_id,
          nom: parts.slice(1).join(' ') || parts[0] || '',
          prenom: parts[0] || '',
          classe: null,
          niveau: r.niveau,
          date_naissance: null,
          absences: 0,
          absences_justifiees: 0,
          source: 'resultats',
        };
      }),
    ];

    res.json(combined);
  } catch (err) {
    console.error("Fetch All Eleves Error:", err.message);
    res.json([]);
  }
});

// --- Get niveaux with class/student counts ---
router.get('/niveaux', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT niveau,
        COUNT(DISTINCT classe)::int AS nb_classes,
        COUNT(*)::int AS nb_eleves
      FROM eleves
      WHERE niveau IS NOT NULL
      GROUP BY niveau
      ORDER BY niveau
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Get classes for a niveau ---
router.get('/classes', async (req, res) => {
  try {
    const { niveau } = req.query;
    if (!niveau) return res.status(400).json({ error: 'niveau is required' });
    const result = await pool.query(`
      SELECT classe, COUNT(*)::int AS nb_eleves
      FROM eleves
      WHERE niveau = $1 AND classe IS NOT NULL
      GROUP BY classe
      ORDER BY classe
    `, [niveau]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Get students by niveau + classe with class stats ---
router.get('/by-classe', async (req, res) => {
  try {
    const { niveau, classe } = req.query;
    if (!niveau || !classe) return res.status(400).json({ error: 'niveau and classe are required' });
    const students = await pool.query(
      'SELECT * FROM eleves WHERE niveau = $1 AND classe = $2 ORDER BY nom ASC',
      [niveau, classe]
    );
    const stats = await pool.query(`
      SELECT
        COUNT(*)::int AS total_eleves,
        COALESCE(SUM(absences), 0)::int AS total_absences,
        COALESCE(SUM(absences_justifiees), 0)::int AS total_justifiees,
        COUNT(*) FILTER (WHERE absences >= 10)::int AS alert_count
      FROM eleves
      WHERE niveau = $1 AND classe = $2
    `, [niveau, classe]);
    res.json({ students: students.rows, stats: stats.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Global search across all students ---
router.get('/search-global', async (req, res) => {
  const { q } = req.query;
  if (!q || q.trim().length < 1) return res.json([]);
  try {
    const result = await pool.query(
      `SELECT id, nom, prenom, classe, niveau, absences, absences_justifiees, id_massar
       FROM eleves
       WHERE nom ILIKE $1 OR prenom ILIKE $1 OR id_massar ILIKE $1
       ORDER BY nom ASC
       LIMIT 15`,
      [`%${q.trim()}%`]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Create a single student ---
router.post('/', async (req, res) => {
  const { id_massar, nom, prenom, classe, niveau, date_naissance, email_parent, telephone_parent } = req.body;
  if (!nom || !prenom) {
    return res.status(400).json({ error: 'Nom et prénom sont obligatoires' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO eleves (id_massar, nom, prenom, classe, niveau, date_naissance, email_parent, telephone_parent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id_massar) DO NOTHING
       RETURNING *`,
      [id_massar || null, nom, prenom, classe || null, niveau || null, date_naissance || null, email_parent || null, telephone_parent || null]
    );
    if (result.rows.length === 0) {
      return res.status(409).json({ error: 'Ce code MASSAR existe déjà' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Update a student ---
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { id_massar, nom, prenom, classe, niveau, date_naissance, email_parent, telephone_parent } = req.body;
  if (!nom || !prenom) {
    return res.status(400).json({ error: 'Nom et prénom sont obligatoires' });
  }
  try {
    const existing = await pool.query('SELECT id FROM eleves WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Élève non trouvé' });
    }
    if (id_massar) {
      const dup = await pool.query('SELECT id FROM eleves WHERE id_massar = $1 AND id != $2', [id_massar, id]);
      if (dup.rows.length > 0) {
        return res.status(409).json({ error: 'Ce code MASSAR est déjà attribué à un autre élève' });
      }
    }
    const result = await pool.query(
      `UPDATE eleves SET id_massar = $1, nom = $2, prenom = $3, classe = $4, niveau = $5, date_naissance = $6, email_parent = $7, telephone_parent = $8
       WHERE id = $9 RETURNING *`,
      [id_massar || null, nom, prenom, classe || null, niveau || null, date_naissance || null, email_parent || null, telephone_parent || null, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Send alert email to parent ---
router.post('/:id/alert-email', async (req, res) => {
  const { id } = req.params;
  try {
    const eleve = await pool.query('SELECT * FROM eleves WHERE id = $1', [id]);
    if (eleve.rows.length === 0) return res.status(404).json({ error: 'Élève non trouvé' });
    const e = eleve.rows[0];
    const total = await pool.query(
      `SELECT COALESCE(SUM(duree),0) AS total FROM absence_records WHERE eleve_id = $1 AND justifie = false`,
      [id]
    );
    const absences = parseFloat(total.rows[0].total);
    const result = await sendAlertEmail({ ...e, absences }, absences);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Delete a student ---
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const existing = await pool.query('SELECT id FROM eleves WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Élève non trouvé' });
    }
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM certificats WHERE eleve_id = $1', [id]);
      await client.query('DELETE FROM dossiers WHERE eleve_id = $1', [id]);
      await client.query('DELETE FROM eleves WHERE id = $1', [id]);
      await client.query('COMMIT');
      res.json({ success: true });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- AI column mapping for Excel import ---
router.post('/import/ai-mapping', async (req, res) => {
  const { headers } = req.body;
  if (!Array.isArray(headers) || headers.length === 0) {
    return res.status(400).json({ error: 'headers array is required' });
  }
  const aiResult = await mapColumns(headers);
  if (aiResult) {
    return res.json({ mapping: aiResult.mapping, unmapped: aiResult.unmapped, source: 'ai' });
  }
  const fallback = fallbackMapping(headers);
  res.json({ mapping: fallback.mapping, unmapped: fallback.unmapped, source: 'fallback' });
});

// --- Import students from Excel ---
router.post('/import', async (req, res) => {
  const { students } = req.body;
  if (!Array.isArray(students) || students.length === 0) {
    return res.status(400).json({ error: 'students array is required' });
  }
  try {
    let imported = 0;
    let skipped = 0;
    const errors = [];
    for (const s of students) {
      if (!s.nom || !s.prenom) {
        errors.push({ row: imported + skipped + 1, reason: 'Nom ou prénom manquant', data: s });
        skipped++;
        continue;
      }
      try {
        const result = await pool.query(
          `INSERT INTO eleves (id_massar, nom, prenom, classe, niveau, date_naissance, email_parent, telephone_parent)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (id_massar) DO NOTHING RETURNING id`,
          [s.id_massar || null, s.nom, s.prenom, s.classe || null, s.niveau || null, s.date_naissance || null, s.email_parent || null, s.telephone_parent || null]
        );
        if (result.rows.length > 0) {
          imported++;
        } else {
          skipped++;
        }
      } catch (err) {
        errors.push({ row: imported + skipped + 1, reason: err.message, data: s });
        skipped++;
      }
    }
    res.json({ imported, skipped, errors });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/absences', async (req, res) => {
  const { id } = req.params;
  const { absences, absences_justifiees } = req.body;
  try {
    const updates = [];
    const values = [];
    let idx = 1;
    if (absences !== undefined) { updates.push(`absences = $${idx++}`); values.push(absences); }
    if (absences_justifiees !== undefined) { updates.push(`absences_justifiees = $${idx++}`); values.push(absences_justifiees); }
    if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });
    values.push(id);
    await pool.query(`UPDATE eleves SET ${updates.join(', ')} WHERE id = $${idx}`, values);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Helper: update eleves counters from absence_records ---
async function updateEleveCounters(eleve_id) {
  await pool.query(
    `UPDATE eleves SET
      absences = COALESCE((SELECT SUM(duree) FROM absence_records WHERE eleve_id = $1 AND justifie = false), 0),
      absences_justifiees = COALESCE((SELECT SUM(duree) FROM absence_records WHERE eleve_id = $1 AND justifie = true), 0)
    WHERE id = $1`,
    [eleve_id]
  );
}

// --- Helper: check alert threshold and create notification ---
async function checkAlertThreshold(eleve_id) {
  const eleve = await pool.query('SELECT * FROM eleves WHERE id = $1', [eleve_id]);
  if (!eleve.rows.length) return;
  const e = eleve.rows[0];
  const total = await pool.query(
    `SELECT COALESCE(SUM(duree),0) AS total FROM absence_records WHERE eleve_id = $1 AND justifie = false`,
    [eleve_id]
  );
  const absences = parseFloat(total.rows[0].total);
  if (absences >= 10) {
    const adminUsers = await pool.query("SELECT id FROM users WHERE role IN ('direction', 'surveillant', 'admin')");
    for (const u of adminUsers.rows) {
      await pool.query(
        "INSERT INTO notifications (user_id, type, message, temps, lu) VALUES ($1, 'absence', $2, NOW(), false)",
        [u.id, `Alerte : ${e.prenom} ${e.nom} a dépassé ${absences}h d'absences`]
      );
    }
    // Envoi email au parent si configuré
    await sendAlertEmail(e, absences);
  }
}

// --- Absence Records CRUD ---

router.get('/absences/records', async (req, res) => {
  try {
    const { date, eleve_id, niveau, month, year } = req.query;
    const conditions = [];
    const params = [];
    let idx = 1;
    if (date) { conditions.push(`a.date = $${idx++}`); params.push(date); }
    if (eleve_id) { conditions.push(`a.eleve_id = $${idx++}`); params.push(eleve_id); }
    if (niveau) { conditions.push(`e.niveau = $${idx++}`); params.push(niveau); }
    if (month && year) {
      conditions.push(`EXTRACT(MONTH FROM a.date) = $${idx++}::int`);
      params.push(parseInt(month));
      conditions.push(`EXTRACT(YEAR FROM a.date) = $${idx++}::int`);
      params.push(parseInt(year));
    }
    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
    const result = await pool.query(`
      SELECT a.*, e.nom, e.prenom, e.id_massar, e.niveau, e.classe,
        s.heure AS seance_heure, s.matiere AS seance_matiere
      FROM absence_records a
      LEFT JOIN eleves e ON a.eleve_id = e.id
      LEFT JOIN seances s ON a.seance_id = s.id
      ${where}
      ORDER BY a.date DESC, e.nom ASC
    `, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/absences/records', async (req, res) => {
  const { eleve_id, date, justifie, motif, justificatif, duree, matiere } = req.body;
  if (!eleve_id) return res.status(400).json({ error: 'eleve_id is required' });
  try {
    const result = await pool.query(
      'INSERT INTO absence_records (eleve_id, date, justifie, motif, justificatif, duree, matiere) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [eleve_id, date || new Date().toISOString().split('T')[0], justifie || false, motif || null, justificatif || null, duree || 1, matiere || null]
    );
    await updateEleveCounters(eleve_id);
    try { await checkAlertThreshold(eleve_id); } catch (_) {}
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erreur POST /absences/records:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post('/absences/records/batch', async (req, res) => {
  const { eleve_ids, date, justifie, motif, duree, matiere } = req.body;
  if (!eleve_ids || !Array.isArray(eleve_ids) || eleve_ids.length === 0) {
    return res.status(400).json({ error: 'eleve_ids array is required' });
  }
  try {
    const inserted = [];
    for (const id of eleve_ids) {
      const r = await pool.query(
        'INSERT INTO absence_records (eleve_id, date, justifie, motif, duree, matiere) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [id, date || new Date().toISOString().split('T')[0], justifie || false, motif || null, duree || 1, matiere || null]
      );
      inserted.push(r.rows[0]);
      await updateEleveCounters(id);
      try { await checkAlertThreshold(id); } catch (_) {}
    }
    res.json(inserted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/absences/records/:id', async (req, res) => {
  const { id } = req.params;
  const { date, justifie, motif, justificatif } = req.body;
  try {
    const sets = [];
    const vals = [];
    let idx = 1;
    if (date !== undefined) { sets.push(`date = $${idx++}`); vals.push(date); }
    if (justifie !== undefined) { sets.push(`justifie = $${idx++}`); vals.push(justifie); }
    if (motif !== undefined) { sets.push(`motif = $${idx++}`); vals.push(motif); }
    if (justificatif !== undefined) { sets.push(`justificatif = $${idx++}`); vals.push(justificatif); }
    if (sets.length === 0) return res.status(400).json({ error: 'No fields' });
    vals.push(id);
    const result = await pool.query(
      `UPDATE absence_records SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`,
      vals
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    await updateEleveCounters(result.rows[0].eleve_id);
    try { await checkAlertThreshold(result.rows[0].eleve_id); } catch (_) {}
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/absences/records/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const rec = await pool.query('DELETE FROM absence_records WHERE id = $1 RETURNING *', [id]);
    if (rec.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    await updateEleveCounters(rec.rows[0].eleve_id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- File Upload for justificatif ---

router.post('/absences/records/:id/upload', upload.single('justificatif'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Aucun fichier fourni' });
    const filePath = `/uploads/absences/${req.file.filename}`;
    const result = await pool.query(
      'UPDATE absence_records SET justificatif = $1 WHERE id = $2 RETURNING *',
      [filePath, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Absence non trouvée' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Statistics ---

router.get('/absences/stats', async (req, res) => {
  try {
    const byNiveau = await pool.query(`
      SELECT e.niveau,
        COUNT(a.id) AS total,
        COUNT(*) FILTER (WHERE a.justifie = true) AS justifiees,
        COUNT(*) FILTER (WHERE a.justifie = false) AS non_justifiees,
        COUNT(DISTINCT a.eleve_id) AS eleves_concernes
      FROM absence_records a
      RIGHT JOIN eleves e ON a.eleve_id = e.id
      GROUP BY e.niveau
      ORDER BY e.niveau
    `);

    const byMonth = await pool.query(`
      SELECT TO_CHAR(a.date, 'YYYY-MM') AS mois,
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE a.justifie = true) AS justifiees,
        COUNT(*) FILTER (WHERE a.justifie = false) AS non_justifiees
      FROM absence_records a
      GROUP BY mois
      ORDER BY mois DESC
      LIMIT 12
    `);

    const topAbsents = await pool.query(`
      SELECT e.id, e.nom, e.prenom, e.niveau, COUNT(a.id) AS total_absences
      FROM absence_records a
      JOIN eleves e ON a.eleve_id = e.id
      WHERE a.justifie = false
      GROUP BY e.id, e.nom, e.prenom, e.niveau
      ORDER BY total_absences DESC
      LIMIT 10
    `);

    const summary = await pool.query(`
      SELECT COUNT(*) AS total_records,
        COUNT(*) FILTER (WHERE justifie = true) AS total_justifiees,
        COUNT(DISTINCT eleve_id) AS total_eleves
      FROM absence_records
    `);

    res.json({
      byNiveau: byNiveau.rows,
      byMonth: byMonth.rows,
      topAbsents: topAbsents.rows,
      summary: summary.rows[0],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Export ---

router.get('/absences/export', async (req, res) => {
  try {
    const { date_from, date_to, niveau } = req.query;
    const conditions = [];
    const params = [];
    let idx = 1;
    if (date_from) { conditions.push(`a.date >= $${idx++}`); params.push(date_from); }
    if (date_to) { conditions.push(`a.date <= $${idx++}`); params.push(date_to); }
    if (niveau) { conditions.push(`e.niveau = $${idx++}`); params.push(niveau); }
    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
    const result = await pool.query(`
      SELECT a.date, e.nom, e.prenom, e.id_massar, e.niveau,
        CASE WHEN a.justifie THEN 'Oui' ELSE 'Non' END AS justifie,
        COALESCE(a.motif, '') AS motif,
        a.duree, a.matiere
      FROM absence_records a
      JOIN eleves e ON a.eleve_id = e.id
      ${where}
      ORDER BY a.date DESC, e.nom ASC
    `, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ───────── Seances (teacher presence) ───────── */

router.post('/seances', authenticate, async (req, res) => {
  try {
    const { niveau, classe, date_seance, heure, matiere, duree } = req.body;
    if (!niveau || !classe || !heure) return res.status(400).json({ error: 'niveau, classe, heure requis' });
    const result = await pool.query(
      `INSERT INTO seances (enseignant_id, niveau, classe, date_seance, heure, matiere, duree)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [req.user.id, niveau, classe, date_seance || new Date().toISOString().split('T')[0], heure, matiere || null, duree || 1]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/seances', authenticate, async (req, res) => {
  try {
    const where = req.user.role === 'employe' ? 'WHERE s.enseignant_id = $1' : '';
    const params = req.user.role === 'employe' ? [req.user.id] : [];
    const result = await pool.query(
      `SELECT s.*, u.prenom||' '||u.nom AS enseignant_nom
       FROM seances s
       JOIN users u ON u.id = s.enseignant_id
       ${where}
       ORDER BY s.date_seance DESC, s.heure DESC
       LIMIT 50`, params
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/seances/:id', authenticate, async (req, res) => {
  try {
    const seance = await pool.query(
      `SELECT s.*, u.prenom||' '||u.nom AS enseignant_nom
       FROM seances s JOIN users u ON u.id = s.enseignant_id
       WHERE s.id = $1`, [req.params.id]
    );
    if (seance.rows.length === 0) return res.status(404).json({ error: 'Seance introuvable' });

    const students = await pool.query(
      `SELECT id, nom, prenom, id_massar FROM eleves WHERE niveau = $1 AND classe = $2 ORDER BY nom, prenom`,
      [seance.rows[0].niveau, seance.rows[0].classe]
    );

    const absences = await pool.query(
      `SELECT eleve_id FROM absence_records WHERE seance_id = $1`, [req.params.id]
    );
    const absentIds = new Set(absences.rows.map(r => r.eleve_id));

    const presences = students.rows.map(s => ({
      ...s,
      present: !absentIds.has(s.id)
    }));

    res.json({ ...seance.rows[0], presences });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/seances/:id/presence', authenticate, async (req, res) => {
  try {
    const { absents } = req.body;
    if (!Array.isArray(absents)) return res.status(400).json({ error: 'absents array required' });

    const seance = await pool.query('SELECT * FROM seances WHERE id = $1', [req.params.id]);
    if (seance.rows.length === 0) return res.status(404).json({ error: 'Seance introuvable' });

    const { matiere, duree } = seance.rows[0];
    const processed = new Set();

    for (const eleve_id of absents) {
      const exists = await pool.query(
        `SELECT id FROM absence_records WHERE seance_id = $1 AND eleve_id = $2`,
        [req.params.id, eleve_id]
      );
      if (exists.rows.length === 0) {
        await pool.query(
          `INSERT INTO absence_records (eleve_id, date, justifie, seance_id, matiere, duree)
           VALUES ($1,$2,false,$3,$4,$5)`,
          [eleve_id, seance.rows[0].date_seance, req.params.id, matiere, duree]
        );
      }
      processed.add(eleve_id);
    }

    if (absents.length === 0) {
      await pool.query(`DELETE FROM absence_records WHERE seance_id = $1`, [req.params.id]);
    }

    await pool.query('UPDATE seances SET statut = $1 WHERE id = $2', ['termine', req.params.id]);

    // Update counters and check threshold for each affected student
    for (const eleve_id of processed) {
      await updateEleveCounters(eleve_id);
      try { await checkAlertThreshold(eleve_id); } catch (_) {}
    }

    res.json({ success: true, absents_marked: absents.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/absences/records/:id/justify', authenticate, async (req, res) => {
  try {
    const { justifie } = req.body;
    if (typeof justifie !== 'boolean') return res.status(400).json({ error: 'justifie (boolean) requis' });

    const rec = await pool.query(
      `UPDATE absence_records SET justifie = $1 WHERE id = $2 RETURNING *`,
      [justifie, req.params.id]
    );
    if (rec.rows.length === 0) return res.status(404).json({ error: 'Absence non trouvée' });

    const eleve_id = rec.rows[0].eleve_id;
    await updateEleveCounters(eleve_id);
    try { await checkAlertThreshold(eleve_id); } catch (_) {}

    res.json(rec.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
