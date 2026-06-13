const express = require('express');
const pool = require('../db');
const { authenticate, requirePermission } = require('../middlewares/auth');

const router = express.Router();
router.use(authenticate);

// Student: mark a course/exercise as viewed
router.post('/student/view', requirePermission('courses:read'), async (req, res) => {
  const { course_id, exercise_id } = req.body;
  if (!course_id && !exercise_id) {
    return res.status(400).json({ error: 'course_id ou exercise_id requis' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO course_views (user_id, course_id, exercise_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, course_id) DO UPDATE SET viewed_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [req.user.id, course_id || null, exercise_id || null]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Teacher: get progress for a specific course
router.get('/teacher/progress/:courseId', requirePermission('courses:read'), async (req, res) => {
  const { courseId } = req.params;
  try {
    const course = await pool.query('SELECT niveau, classe FROM courses WHERE id = $1', [courseId]);
    if (course.rows.length === 0) return res.status(404).json({ error: 'Cours non trouvé' });

    const { niveau, classe } = course.rows[0];
    const students = await pool.query(
      `SELECT e.id, e.nom, e.prenom, cv.viewed_at
       FROM eleves e
       LEFT JOIN course_views cv ON cv.user_id = e.user_id AND cv.course_id = $1
       WHERE e.niveau = $2 AND e.classe = $3 AND e.user_id IS NOT NULL
       ORDER BY e.nom, e.prenom`,
      [courseId, niveau, classe]
    );
    res.json({
      total: students.rows.length,
      viewed: students.rows.filter(s => s.viewed_at).length,
      students: students.rows.map(s => ({
        id: s.id,
        nom: s.nom,
        prenom: s.prenom,
        viewed: !!s.viewed_at,
        viewed_at: s.viewed_at,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Teacher: get progress for a specific exercise
router.get('/teacher/progress/exercise/:exerciseId', requirePermission('courses:read'), async (req, res) => {
  const { exerciseId } = req.params;
  try {
    const exercise = await pool.query('SELECT niveau, classe FROM exercises WHERE id = $1', [exerciseId]);
    if (exercise.rows.length === 0) return res.status(404).json({ error: 'Exercice non trouvé' });

    const { niveau, classe } = exercise.rows[0];
    const students = await pool.query(
      `SELECT e.id, e.nom, e.prenom, cv.viewed_at
       FROM eleves e
       LEFT JOIN course_views cv ON cv.user_id = e.user_id AND cv.exercise_id = $1
       WHERE e.niveau = $2 AND e.classe = $3 AND e.user_id IS NOT NULL
       ORDER BY e.nom, e.prenom`,
      [exerciseId, niveau, classe]
    );
    res.json({
      total: students.rows.length,
      viewed: students.rows.filter(s => s.viewed_at).length,
      students: students.rows.map(s => ({
        id: s.id,
        nom: s.nom,
        prenom: s.prenom,
        viewed: !!s.viewed_at,
        viewed_at: s.viewed_at,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
