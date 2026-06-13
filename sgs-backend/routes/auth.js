const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { JWT_SECRET } = require('../middlewares/auth');

const router = express.Router();

const ROLE_PERMISSIONS = {
  admin: [
    'hr:read_all', 'hr:validate', 'hr:create_request', 'hr:read_own',
    'finance:read', 'finance:manage_expense', 'finance:manage_revenue', 'finance:generate_bilan',
    'students:read', 'students:manage',
    'certificates:generate', 'grades:manage', 'grades:read',
    'users:manage',
  ],
  direction: [
    'hr:read_all', 'hr:validate',
    'finance:read', 'finance:manage_expense', 'finance:manage_revenue', 'finance:generate_bilan',
    'students:read', 'students:manage',
    'certificates:generate', 'grades:manage', 'grades:read',
  ],
  service_financier: [
    'finance:read', 'finance:manage_expense', 'finance:manage_revenue', 'finance:generate_bilan',
  ],
  surveillant: [
    'students:read', 'students:manage',
  ],
  enseignant: [
    'courses:read', 'courses:manage', 'exercises:read', 'profile:read',
    'students:read', 'hr:read_own', 'hr:create_request',
  ],
  eleve: [
    'courses:read', 'exercises:read', 'profile:read',
  ],

};

const ROLE_MAP = {
  admin: 'administrateur',
  surveillant: 'surveillant_general',
  enseignant: 'enseignant',
  eleve: 'eleve',
  direction: 'direction',
  service_financier: 'service_financier',
};

const ROLE_MAP_REVERSE = {
  administrateur: 'admin',
  surveillant_general: 'surveillant',
  enseignant: 'enseignant',
  eleve: 'eleve',
  direction: 'direction',
  service_financier: 'service_financier',
};

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }
    const user = userResult.rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }
    const dbRole = user.role || 'enseignant';
    const roleName = ROLE_MAP[dbRole] || dbRole;
    const permissions = ROLE_PERMISSIONS[dbRole] || ROLE_PERMISSIONS.employe;
    const token = jwt.sign(
      { id: user.id, dbRole, role: roleName, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    res.json({
      token,
      user: { id: user.id, nom: user.nom, prenom: user.prenom, email: user.email, role: roleName, dbRole, permissions, photo: user.photo, telephone: user.telephone, poste: user.poste, matricule: user.matricule, initiales: user.initiales, subject: user.subject },
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ message: err.message });
  }
});

function normalizeEmail(str) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
}

router.post('/signup', async (req, res) => {
  let { nom, prenom, email, password, role, subject, eleve_id } = req.body;
  try {
    const dbRole = ROLE_MAP_REVERSE[role] || role || 'enseignant';
    if (dbRole === 'eleve' && eleve_id && (!email || !password)) {
      const student = await pool.query('SELECT nom, prenom, id_massar FROM eleves WHERE id = $1', [eleve_id]);
      if (!student.rows.length) {
        return res.status(400).json({ error: 'Élève introuvable' });
      }
      const s = student.rows[0];
      nom = s.nom;
      prenom = s.prenom;
      email = normalizeEmail(s.prenom) + normalizeEmail(s.nom) + '@borjazzaitoune.ma';
      password = s.id_massar;
    }
    if (!nom || !email || !password) {
      return res.status(400).json({ error: 'Champs requis manquants' });
    }
    const initiales = ((prenom || '')[0] || '') + ((nom || '')[0] || '');
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (nom, prenom, email, password, role, initiales, actif, subject)
       VALUES ($1, $2, $3, $4, $5, $6, true, $7) RETURNING *`,
      [nom, prenom || '', email, hashedPassword, dbRole, initiales.toUpperCase(), subject || '']
    );
    if (dbRole === 'eleve' && eleve_id) {
      await pool.query('UPDATE eleves SET user_id = $1 WHERE id = $2', [result.rows[0].id, eleve_id]);
    }
    res.json({ ...result.rows[0], generatedEmail: email, generatedPassword: password });
  } catch (err) {
    if (err.code === '23505') {
      res.status(400).json({ error: 'Cet email existe déjà' });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

module.exports = router;
