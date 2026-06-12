const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'sgs-secret-key-change-in-production-2026';

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Non autorisé: token manquant' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Non autorisé: token invalide ou expiré' });
  }
};

const requirePermission = (requiredSlug) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Non autorisé' });
    }

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

    const permissions = ROLE_PERMISSIONS[req.user.dbRole] || ROLE_PERMISSIONS.employe;
    if (permissions.includes(requiredSlug) || req.user.dbRole === 'admin') {
      next();
    } else {
      res.status(403).json({ error: 'Accès refusé', message: `Permission '${requiredSlug}' requise` });
    }
  };
};

module.exports = { authenticate, requirePermission, JWT_SECRET };
