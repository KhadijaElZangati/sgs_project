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
  employe: [
    'hr:read_own', 'hr:create_request',
    'students:read',
  ],
};

const ROLE_MAP = {
  admin: 'administrateur',
  surveillant: 'surveillant_general',
  direction: 'direction',
  service_financier: 'service_financier',
  employe: 'employe',
};

const ROLE_MAP_REVERSE = {
  administrateur: 'admin',
  surveillant_general: 'surveillant',
  direction: 'direction',
  service_financier: 'service_financier',
  employe: 'employe',
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
    const dbRole = user.role || 'employe';
    const roleName = ROLE_MAP[dbRole] || dbRole;
    const permissions = ROLE_PERMISSIONS[dbRole] || ROLE_PERMISSIONS.employe;
    const token = jwt.sign(
      { id: user.id, dbRole, role: roleName, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    res.json({
      token,
      user: { id: user.id, nom: user.nom, prenom: user.prenom, email: user.email, role: roleName, permissions, photo: user.photo, telephone: user.telephone, poste: user.poste, matricule: user.matricule, initiales: user.initiales },
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ message: err.message });
  }
});

router.post('/signup', async (req, res) => {
  const { nom, prenom, email, password, role } = req.body;
  try {
    if (!nom || !email || !password) {
      return res.status(400).json({ error: 'Champs requis manquants' });
    }
    const initiales = ((prenom || '')[0] || '') + ((nom || '')[0] || '');
    const dbRole = ROLE_MAP_REVERSE[role] || role || 'employe';
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (nom, prenom, email, password, role, initiales, actif)
       VALUES ($1, $2, $3, $4, $5, $6, true) RETURNING *`,
      [nom, prenom || '', email, hashedPassword, dbRole, initiales.toUpperCase()]
    );
    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      res.status(400).json({ error: 'Cet email existe déjà' });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

module.exports = router;
