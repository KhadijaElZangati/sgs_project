const express = require('express');
const pool = require('../db');
const { authenticate, requirePermission } = require('../middlewares/auth');

const router = express.Router();
router.use(authenticate);

router.get('/profile', requirePermission('profile:read'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, id_massar, nom, prenom, niveau, classe, user_id FROM eleves WHERE user_id = $1`,
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Aucun élève lié à ce compte' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/subjects', requirePermission('courses:read'), async (req, res) => {
  try {
    const eleve = await pool.query('SELECT niveau, classe FROM eleves WHERE user_id = $1', [req.user.id]);
    if (eleve.rows.length === 0) return res.json([]);

    const { niveau, classe } = eleve.rows[0];
    const courses = await pool.query(
      `SELECT DISTINCT c.subject, u.prenom AS teacher_prenom, u.nom AS teacher_nom
       FROM courses c LEFT JOIN users u ON u.id = c.teacher_id
       WHERE c.niveau = $1 AND c.classe = $2 AND c.subject IS NOT NULL AND c.subject != ''`,
      [niveau, classe]
    );
    const exercises = await pool.query(
      `SELECT DISTINCT e.subject, u.prenom AS teacher_prenom, u.nom AS teacher_nom
       FROM exercises e LEFT JOIN users u ON u.id = e.teacher_id
       WHERE e.niveau = $1 AND e.classe = $2 AND e.subject IS NOT NULL AND e.subject != ''`,
      [niveau, classe]
    );
    const assignments = await pool.query(
      `SELECT DISTINCT ta.subject, u.prenom AS teacher_prenom, u.nom AS teacher_nom
       FROM teacher_assignments ta
       JOIN users u ON u.id = ta.user_id
       WHERE ta.niveau = $1 AND ta.classe = $2 AND ta.subject IS NOT NULL AND ta.subject != ''`,
      [niveau, classe]
    );
    const subjectsMap = new Map();
    for (const r of courses.rows) {
      if (!subjectsMap.has(r.subject)) {
        subjectsMap.set(r.subject, { subject: r.subject, teacher_prenom: r.teacher_prenom, teacher_nom: r.teacher_nom });
      }
    }
    for (const r of exercises.rows) {
      if (!subjectsMap.has(r.subject)) {
        subjectsMap.set(r.subject, { subject: r.subject, teacher_prenom: r.teacher_prenom, teacher_nom: r.teacher_nom });
      }
    }
    for (const r of assignments.rows) {
      if (!subjectsMap.has(r.subject)) {
        subjectsMap.set(r.subject, { subject: r.subject, teacher_prenom: r.teacher_prenom, teacher_nom: r.teacher_nom });
      }
    }
    res.json([...subjectsMap.values()].sort((a, b) => a.subject.localeCompare(b.subject)));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/courses', requirePermission('courses:read'), async (req, res) => {
  try {
    const { subject } = req.query;
    const eleve = await pool.query('SELECT niveau, classe FROM eleves WHERE user_id = $1', [req.user.id]);
    if (eleve.rows.length === 0) return res.json({ data: [] });

    const { niveau, classe } = eleve.rows[0];
    const params = [niveau, classe];
    let subjectClause = '';
    if (subject) { subjectClause = 'AND c.subject = $3'; params.push(subject); }

    const result = await pool.query(
      `SELECT c.*, u.nom AS teacher_nom, u.prenom AS teacher_prenom
       FROM courses c
       LEFT JOIN users u ON u.id = c.teacher_id
       WHERE c.niveau = $1 AND c.classe = $2 AND c.status = 'published' ${subjectClause}
       ORDER BY c.created_at DESC`,
      params
    );
    res.json({ data: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/exercises', requirePermission('exercises:read'), async (req, res) => {
  try {
    const { subject } = req.query;
    const eleve = await pool.query('SELECT niveau, classe FROM eleves WHERE user_id = $1', [req.user.id]);
    if (eleve.rows.length === 0) return res.json({ data: [] });

    const { niveau, classe } = eleve.rows[0];
    const params = [niveau, classe];
    let subjectClause = '';
    if (subject) { subjectClause = 'AND e.subject = $3'; params.push(subject); }

    const result = await pool.query(
      `SELECT e.*, u.nom AS teacher_nom, u.prenom AS teacher_prenom
       FROM exercises e
       LEFT JOIN users u ON u.id = e.teacher_id
       WHERE e.niveau = $1 AND e.classe = $2 AND e.status = 'published' ${subjectClause}
       ORDER BY e.created_at DESC`,
      params
    );
    res.json({ data: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
