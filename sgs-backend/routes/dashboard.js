const express = require('express');
const pool = require('../db');

const router = express.Router();

router.get('/stats', async (req, res) => {
  try {
    const [usersCount, studentsCount, certsCount, opsSum, recentReqs, currMonthRev, prevMonthRev, currMonthCerts, prevMonthCerts, staffCount] = await Promise.all([
      pool.query('SELECT COUNT(*)::int AS count FROM users'),
      pool.query('SELECT COUNT(*)::int AS count FROM eleves'),
      pool.query('SELECT COUNT(*)::int AS count FROM certificats'),
      pool.query("SELECT COALESCE(SUM(montant),0) AS total FROM operations WHERE type='revenu' AND statut='valide'"),
      pool.query(`
        SELECT d.id, d.type, d.statut, u.prenom || ' ' || u.nom AS "employeeName"
        FROM demandes_rh d
        LEFT JOIN users u ON d.employe_id = u.id
        ORDER BY d.id DESC LIMIT 5
      `),
      pool.query(`
        SELECT COALESCE(SUM(montant),0) AS total FROM operations
        WHERE type='revenu' AND statut='valide'
        AND date >= DATE_TRUNC('month', CURRENT_DATE)
      `),
      pool.query(`
        SELECT COALESCE(SUM(montant),0) AS total FROM operations
        WHERE type='revenu' AND statut='valide'
        AND date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
        AND date < DATE_TRUNC('month', CURRENT_DATE)
      `),
      pool.query(`
        SELECT COUNT(*)::int AS count FROM certificats
        WHERE date_emission >= DATE_TRUNC('month', CURRENT_DATE)
      `),
      pool.query(`
        SELECT COUNT(*)::int AS count FROM certificats
        WHERE date_emission >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
        AND date_emission < DATE_TRUNC('month', CURRENT_DATE)
      `),
      pool.query("SELECT COUNT(*)::int AS count FROM users WHERE actif = true"),
    ]);

    const currRev = parseFloat(currMonthRev.rows[0].total);
    const prevRev = parseFloat(prevMonthRev.rows[0].total);
    const revenueTrend = prevRev > 0 ? Math.round(((currRev - prevRev) / prevRev) * 100) : 0;

    const currCerts = currMonthCerts.rows[0].count;
    const prevCerts = prevMonthCerts.rows[0].count;
    const certificateTrend = prevCerts > 0 ? Math.round(((currCerts - prevCerts) / prevCerts) * 100) : 0;

    res.json({
      activeUsers: usersCount.rows[0].count,
      usersTrend: 0,
      monthlyRevenue: parseFloat(opsSum.rows[0].total),
      revenueTrend,
      totalStudents: studentsCount.rows[0].count,
      certificatesGenerated: certsCount.rows[0].count,
      certificateTrend,
      staffCount: staffCount.rows[0].count,
      recentRequests: recentReqs.rows,
    });
  } catch (err) {
    console.error("Dashboard Stats Error:", err.message);
    res.json({ recentRequests: [], activeUsers: 0, totalStudents: 0, monthlyRevenue: 0, certificatesGenerated: 0, usersTrend: 0, revenueTrend: 0, certificateTrend: 0, staffCount: 0 });
  }
});

router.get('/finance-stats', async (req, res) => {
  try {
    const [revenus, depenses, totalOps] = await Promise.all([
      pool.query("SELECT COALESCE(SUM(montant),0) AS total FROM operations WHERE type='revenu' AND statut='valide'"),
      pool.query("SELECT COALESCE(SUM(montant),0) AS total FROM operations WHERE type='depense' AND statut='valide'"),
      pool.query('SELECT COUNT(*)::int AS count FROM operations'),
    ]);
    res.json({
      totalRevenus: parseFloat(revenus.rows[0].total),
      totalDepenses: parseFloat(depenses.rows[0].total),
      solde: parseFloat(revenus.rows[0].total) - parseFloat(depenses.rows[0].total),
      totalOperations: totalOps.rows[0].count,
    });
  } catch (err) {
    res.json({ totalRevenus: 0, totalDepenses: 0, solde: 0, totalOperations: 0 });
  }
});

router.get('/eleves-stats', async (req, res) => {
  try {
    const [total, absences] = await Promise.all([
      pool.query("SELECT COUNT(*)::int AS count, COUNT(DISTINCT niveau) AS niveaux FROM eleves"),
      pool.query("SELECT COALESCE(SUM(absences),0)::int AS total FROM eleves"),
    ]);
    res.json({
      totalEleves: total.rows[0].count,
      niveaux: total.rows[0].niveaux,
      totalAbsences: absences.rows[0].total,
    });
  } catch (err) {
    res.json({ totalEleves: 0, niveaux: 0, totalAbsences: 0 });
  }
});

router.get('/absence-chart', async (req, res) => {
  try {
    const [elevesResult, weeklyResult] = await Promise.all([
      pool.query(`
        SELECT COALESCE(SUM(absences),0)::int AS total,
               COALESCE(SUM(absences_justifiees),0)::int AS justifiees
        FROM eleves
      `),
      pool.query(`
        SELECT
          DATE_TRUNC('week', date + interval '1 day') AS semaine,
          COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE justifie = true)::int AS justifiees
        FROM absence_records
        WHERE date >= CURRENT_DATE - INTERVAL '12 weeks'
        GROUP BY semaine
        ORDER BY semaine
      `),
    ]);

    const totalAbs = elevesResult.rows[0].total;
    const justifiees = elevesResult.rows[0].justifiees;
    const injustifiees = Math.max(0, totalAbs - justifiees);

    const weeks = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay() - i * 7);
      const weekStartStr = weekStart.toISOString().split('T')[0];
      const found = weeklyResult.rows.find(r => {
        const d = new Date(r.semaine);
        return d.toISOString().split('T')[0] === weekStartStr;
      });
      weeks.push(found ? found.total : 0);
    }

    res.json({
      weeks,
      total: totalAbs,
      justifiees,
      injustifiees,
      justifieesPercent: totalAbs > 0 ? Math.round((justifiees / totalAbs) * 100) : 0,
      injustifieesPercent: totalAbs > 0 ? Math.round((injustifiees / totalAbs) * 100) : 0,
    });
  } catch (err) {
    console.error("Absence Chart Error:", err.message);
    res.json({ weeks: [0,0,0,0,0,0,0,0,0,0,0,0], total: 0, justifiees: 0, injustifiees: 0, justifieesPercent: 0, injustifieesPercent: 0 });
  }
});

router.get('/school-life-stats', async (req, res) => {
  try {
    const [total, niveaux, alerte, absentsToday, justifieesToday, totalAbs] = await Promise.all([
      pool.query('SELECT COUNT(*)::int AS count FROM eleves'),
      pool.query('SELECT COUNT(DISTINCT niveau)::int AS count FROM eleves'),
      pool.query('SELECT COUNT(*)::int AS count FROM eleves WHERE absences > 10'),
      pool.query('SELECT COUNT(*)::int AS count FROM eleves WHERE absences > 0 AND absences - absences_justifiees > 0'),
      pool.query("SELECT COALESCE(SUM(absences_justifiees),0)::int AS total FROM eleves"),
      pool.query("SELECT COALESCE(SUM(absences),0)::int AS total FROM eleves"),
    ]);
    res.json({
      totalEleves: total.rows[0].count,
      niveaux: niveaux.rows[0].count,
      alertes: alerte.rows[0].count,
      absentsToday: absentsToday.rows[0].count,
      justifieesToday: justifieesToday.rows[0].total,
      injustifieesToday: Math.max(0, absentsToday.rows[0].count - justifieesToday.rows[0].total),
      totalAbsences: totalAbs.rows[0].total,
    });
  } catch (err) {
    console.error("School Life Stats Error:", err.message);
    res.json({ totalEleves: 0, niveaux: 0, alertes: 0, absentsToday: 0, justifieesToday: 0, injustifieesToday: 0, totalAbsences: 0 });
  }
});

module.exports = router;
