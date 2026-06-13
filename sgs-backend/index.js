process.on('unhandledRejection', function(err) {
  console.error('UNHANDLED REJECTION:', err && err.message || err);
});
process.on('uncaughtException', function(err) {
  console.error('UNCAUGHT EXCEPTION:', err && err.message || err);
});

require('dotenv').config();
const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');

const assistantRoutes = require('./routes/assistant');
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const rhRoutes = require('./routes/rh');
const financeRoutes = require('./routes/finance');
const schoolRoutes = require('./routes/school');
const { resultatsRouter, certificatsRouter } = require('./routes/documents');
const userRoutes = require('./routes/users');
const notificationRoutes = require('./routes/notifications');
const coursesRoutes = require('./routes/courses');
const exercisesRoutes = require('./routes/exercises');
const videosRoutes = require('./routes/videos');
const progressRoutes = require('./routes/progress');
const studentRoutes = require('./routes/student');
const teacherRoutes = require('./routes/teacher');
const commentsRoutes = require('./routes/comments');
const { Server } = require('socket.io');

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const { Pool } = require('pg');
const pool = new Pool({
  user: 'sgs_admin',
  host: 'localhost',
  database: 'sgs_db',
  password: 'sgs_pass_2026',
  port: 5432,
});
let DEFAULT_USER = { id: 5, nom: 'Admin', prenom: '', email: 'admin@college.ma', role: 'administrateur' };
(async () => {
  try {
    const result = await pool.query('SELECT id, nom, prenom, email, role FROM users WHERE role = $1 LIMIT 1', ['admin']);
    if (result.rows.length > 0) {
      const u = result.rows[0];
      DEFAULT_USER = { id: u.id, nom: u.nom, prenom: u.prenom, email: u.email, role: 'administrateur' };
    }
  } catch (e) { /* ignore */ }
})();

app.use((req, res, next) => {
  req.user = DEFAULT_USER;
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/demandes-rh', rhRoutes);
app.use('/api/operations', financeRoutes);
app.use('/api/eleves', schoolRoutes);
app.use('/api/resultats', resultatsRouter);
app.use('/api/certificats', certificatsRouter);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/assistant', assistantRoutes);
app.use('/api/courses', coursesRoutes);
app.use('/api/exercises', exercisesRoutes);
app.use('/api/videos', videosRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/comments', commentsRoutes);

app.post('/api/assistant/generate/attestation-travail', async (req, res) => {
  try {
    const { employee_id } = req.body;
    const id = employee_id || req.user?.id || 1;
    const emp = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    if (emp.rows.length === 0) return res.status(404).json({ error: 'Employé non trouvé' });
    const e = emp.rows[0];
    const numero = `ATT-${String(Date.now()).slice(-8)}`;
    const date = new Date().toISOString().split('T')[0];
    res.json({
      success: true, numero, date,
      employee: `${e.prenom} ${e.nom}`,
      poste: e.poste || 'Employé',
      message: `Attestation de travail générée pour ${e.prenom} ${e.nom} (N° ${numero})`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/assistant/generate/certificat-scolaire', async (req, res) => {
  try {
    const { eleve_id } = req.body;
    if (!eleve_id) {
      const students = await pool.query('SELECT id, nom, prenom, niveau FROM eleves ORDER BY nom');
      return res.json({ need_student: true, students: students.rows });
    }
    const student = await pool.query('SELECT * FROM eleves WHERE id = $1', [eleve_id]);
    if (student.rows.length === 0) return res.status(404).json({ error: 'Élève non trouvé' });
    const s = student.rows[0];
    const numero = `CERT-${String(Date.now()).slice(-8)}`;
    await pool.query(
      'INSERT INTO certificats (eleve_id, numero, date_emission, statut) VALUES ($1, $2, CURRENT_DATE, $3)',
      [eleve_id, numero, 'généré']
    );
    res.json({
      success: true, numero,
      date: new Date().toISOString().split('T')[0],
      student: `${s.prenom} ${s.nom}`,
      niveau: s.niveau,
      message: `Certificat scolaire généré pour ${s.prenom} ${s.nom} (N° ${numero})`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: 'http://localhost:5173', methods: ['GET', 'POST'] }
});
require('./socket')(io);
server.listen(port, () => {
  console.log(`SGS Backend running on http://localhost:${port}`);
});
