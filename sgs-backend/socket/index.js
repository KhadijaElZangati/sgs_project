const pool = require('../db');

module.exports = function(io) {
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Token manquant'));
    try {
      const jwt = require('jsonwebtoken');
      const { JWT_SECRET } = require('../middlewares/auth');
      const decoded = jwt.verify(token, JWT_SECRET);
      socket.userId = decoded.id;
      socket.dbRole = decoded.dbRole;
      next();
    } catch {
      next(new Error('Token invalide'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.userId;

    socket.join(`user:${userId}`);

    // Rejoindre le canal de classe si l'utilisateur a une classe
    try {
      if (socket.dbRole === 'eleve') {
        const res = await pool.query('SELECT niveau, classe FROM eleves WHERE user_id = $1', [userId]);
        if (res.rows.length) {
          socket.niveau = res.rows[0].niveau;
          socket.classe = res.rows[0].classe;
          socket.join(`class:${socket.niveau}:${socket.classe}`);
        }
      } else if (socket.dbRole === 'enseignant') {
        const res = await pool.query(
          'SELECT DISTINCT niveau, classe FROM teacher_assignments WHERE user_id = $1',
          [userId]
        );
        res.rows.forEach(r => socket.join(`class:${r.niveau}:${r.classe}`));
      }
    } catch {}

    // Envoyer un message
    socket.on('send_message', async (data, callback) => {
      const { receiver_id, message, niveau, class_id, communaute, subject } = data;
      if (!message?.trim()) return;

      try {
        const result = await pool.query(
          `INSERT INTO messages (sender_id, receiver_id, class_id, niveau, subject, communaute, message)
           VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
          [userId, receiver_id || null, class_id || null, niveau || null, subject || null, communaute || false, message.trim()]
        );
        const msg = result.rows[0];

        // Ajouter le nom de l'expéditeur
        const userRes = await pool.query('SELECT nom, prenom FROM users WHERE id = $1', [userId]);
        msg.sender = userRes.rows[0] || {};

        if (communaute && niveau && class_id) {
          io.to(`class:${niveau}:${class_id}`).emit('new_message', msg);
        } else if (receiver_id) {
          io.to(`user:${receiver_id}`).emit('new_message', msg);
        }
        callback?.(msg);
      } catch (err) {
        callback?.({ error: err.message });
      }
    });

    // Récupérer les conversations
    socket.on('get_conversations', async (_, callback) => {
      try {
        const result = await pool.query(
          `SELECT DISTINCT ON (other_id) other_id, u.nom, u.prenom, u.initiales, m.message, m.created_at, m.read_at, m.sender_id
           FROM (
             SELECT
               CASE WHEN sender_id = $1 THEN receiver_id ELSE sender_id END AS other_id,
               message, created_at, read_at, sender_id
             FROM messages
             WHERE sender_id = $1 OR receiver_id = $1
           ) m
           JOIN users u ON u.id = m.other_id
           WHERE m.other_id IS NOT NULL
           ORDER BY other_id, m.created_at DESC`,
          [userId]
        );
        callback(result.rows);
      } catch {}
    });

    // Récupérer une conversation spécifique
    socket.on('get_conversation', async (data, callback) => {
      const { otherId } = data;
      if (!otherId) return;
      try {
        const result = await pool.query(
          `SELECT m.*, u.nom AS sender_nom, u.prenom AS sender_prenom
           FROM messages m
           JOIN users u ON u.id = m.sender_id
           WHERE (m.sender_id = $1 AND m.receiver_id = $2) OR (m.sender_id = $2 AND m.receiver_id = $1)
           ORDER BY m.created_at ASC`,
          [userId, otherId]
        );
        callback(result.rows);
      } catch {}
    });

    // Récupérer le fil communautaire
    socket.on('get_class_feed', async (data, callback) => {
      const niveau = data?.niveau || socket.niveau;
      const classe = data?.classe || socket.classe;
      if (!niveau || !classe) return callback([]);
      try {
        const result = await pool.query(
          `SELECT m.*, u.nom AS sender_nom, u.prenom AS sender_prenom
           FROM messages m
           JOIN users u ON u.id = m.sender_id
           WHERE m.communaute = true AND m.niveau = $1 AND m.class_id = $2
           ORDER BY m.created_at DESC
           LIMIT 100`,
          [niveau, classe]
        );
        callback(result.rows);
      } catch {}
    });

    // Marquer comme lu
    socket.on('mark_read', async (data, callback) => {
      const { messageIds } = data;
      if (!messageIds?.length) return;
      try {
        await pool.query(
          `UPDATE messages SET read_at = NOW() WHERE id = ANY($1::int[]) AND receiver_id = $2`,
          [messageIds, userId]
        );
        callback({ success: true });
      } catch {}
    });

    // Obtenir les profs de l'élève
    socket.on('get_teachers', async (_, callback) => {
      if (!socket.niveau || !socket.classe) return callback([]);
      try {
        const result = await pool.query(
          `SELECT DISTINCT u.id, u.nom, u.prenom, u.initiales, ta.subject
           FROM teacher_assignments ta
           JOIN users u ON u.id = ta.user_id
           WHERE ta.niveau = $1 AND ta.classe = $2`,
          [socket.niveau, socket.classe]
        );
        callback(result.rows);
      } catch {}
    });

    // Obtenir les classes d'un enseignant
    socket.on('get_teacher_classes', async (_, callback) => {
      try {
        const result = await pool.query(
          `SELECT DISTINCT ta.niveau, ta.classe, ta.subject
           FROM teacher_assignments ta
           WHERE ta.user_id = $1
           ORDER BY ta.niveau, ta.classe`,
          [userId]
        );
        callback(result.rows);
      } catch (err) {
        callback([]);
      }
    });

    // Obtenir les élèves d'un prof (pour sa matière)
    socket.on('get_students', async (data, callback) => {
      const { niveau, classe } = data;
      if (!niveau || !classe) return callback([]);
      try {
        const result = await pool.query(
          `SELECT e.id, e.nom, e.prenom, e.user_id
           FROM eleves e
           WHERE e.niveau = $1 AND e.classe = $2 AND e.user_id IS NOT NULL`,
          [niveau, classe]
        );
        callback(result.rows);
      } catch {}
    });

    // Typing indicator
    socket.on('typing', (data) => {
      const { receiver_id } = data;
      if (receiver_id) {
        io.to(`user:${receiver_id}`).emit('typing', { userId, dbRole: socket.dbRole });
      }
    });

    socket.on('stop_typing', (data) => {
      const { receiver_id } = data;
      if (receiver_id) {
        io.to(`user:${receiver_id}`).emit('stop_typing', { userId });
      }
    });
  });
};
