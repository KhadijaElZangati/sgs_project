const express = require('express');
const router = express.Router();
const pool = require('../db');
const fs = require('fs');
const path = require('path');
const { authenticate } = require('../middlewares/auth');

try {
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx > 0) {
          const key = trimmed.slice(0, eqIdx).trim();
          let val = trimmed.slice(eqIdx + 1).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          if (!process.env[key]) process.env[key] = val;
        }
      }
    }
  }
} catch (e) { /* ignore .env errors */ }

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

const DB_SCHEMA = `Table: users (columns: id PK, nom, prenom, role, email, actif, initiales, poste, matricule, solde_conge, password, role_id)
Table: eleves (columns: id PK, id_massar, nom, prenom, classe, niveau, date_naissance, absences, absences_justifiees)
Table: resultats (columns: id PK, massar_id, eleve_name, niveau, trimestre, maths, physique, svt, francais, arabe, anglais, histoire_geo, education_islamique, informatique, eps, musique, art, moyenne_generale, date_import)
Table: operations (columns: id PK, type, categorie, description, montant, date, statut, saisie_par)
Table: demandes_rh (columns: id PK, employe_id, type, statut, date_creation, date_debut, date_fin, motif, piece_jointe, commentaire)
Table: certificats (columns: id PK, eleve_id, numero, date_emission, annee_scol, statut)
Table: dossiers (columns: id PK, type, titre, eleve_id, classe, date, statut, transmis, destinataire)
Table: notifications (columns: id PK, user_id FK, type, message, temps, lu)`;

function isArabic(text) {
  return /[\u0600-\u06FF]/.test(text);
}

async function callGroq(messages, user) {
  var schema = DB_SCHEMA;
  var userName = (user && user.nom) || '';
  var userRole = (user && user.role) || '';
  var sysContent = 'You are SGS AI assistant for a Moroccan school (Collège Borj Azaitoune). Respond in the users language (French/Arabic/Darija). DB schema:\n' + schema + '\nRules: 1) Use [SQL]query[/SQL] to generate and execute PostgreSQL queries. 2) Never include any comments in SQL (no --, no //, no /* */). Output ONLY the raw SQL inside the tags. 3) For greetings, no SQL needed. 4) If data is unavailable, say so. 5) Use emojis. 6) For case-insensitive searches, use ILIKE. 7) DOC GENERATION: When user asks for attestation/certificat: (a) ATTESTATION — query users table. Do NOT filter by role. Example: SELECT nom, prenom, poste FROM users WHERE nom ILIKE \'%Zangati%\' OR prenom ILIKE \'%Zangati%\' OR CONCAT(prenom,\' \',nom) ILIKE \'%Zangati%\'. (b) CERTIFICAT — FIRST try eleves table using ILIKE on nom/prenom/CONCAT. IF no results, SECOND try resultats table: SELECT eleve_name, niveau, massar_id FROM resultats WHERE eleve_name ILIKE \'%searchterm%\'. Many students are ONLY in resultats, not in eleves! (c) After getting DB results, format as [DOC:TYPE:JSON]. Respond naturally in the users language — do NOT force French phrases for documents. If the user asked in Arabic, respond in Arabic. 8) DOC format attestation: [DOC:attestation:{"employee":"Enseignant Zangati","poste":"Professeur d\'Informatique","date":"11/06/2026"}]. 9) DOC format certificat from eleves: [DOC:certificat:{"student":"Amrani Youssef","studentLatin":"Youssef Amrani","niveau":"2AC","dateNaissance":"2012-04-12","massarId":"M20089042","date":"11/06/2026"}]. DOC format certificat from resultats (no dateNaissance available): [DOC:certificat:{"student":"Meryem El Fassi","studentLatin":"Meryem El Fassi","niveau":"3AC","dateNaissance":"","massarId":"20","date":"11/06/2026"}]. Use the actual values from your query result. 10) CRITICAL: If a user asks for an attestation or certificat WITHOUT providing a persons name, DO NOT query the database. Instead, ASK for the persons name first in the users language. Wait for them to provide it before proceeding with any SQL or document generation. Current user: ' + userName + '(' + userRole + ').';
  const systemMsg = { role: 'system', content: sysContent };

  const body = {
    model: GROQ_MODEL,
    messages: [systemMsg, ...messages],
    temperature: 0.7,
    max_tokens: 2048,
  };

  var res;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(function() { controller.abort(); }, 30000);
    res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeout);
  } catch (fetchErr) {
    throw new Error('Groq API request failed: ' + (fetchErr.message || 'connection error'));
  }

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.choices[0].message.content;
}

function extractSQL(text) {
  const match = text.match(/\[SQL\]([\s\S]*?)\[\/SQL\]/);
  if (match) return match[1].trim();
  return null;
}

router.post('/ask', authenticate, async (req, res) => {
  try {
    const { question, conversation_id } = req.body;
    const user = req.user;

    if (!question) return res.status(400).json({ error: 'Question requise' });
    if (!GROQ_API_KEY) {
      return res.status(503).json({ error: 'Groq API key not configured', answer: 'Le service IA n\'est pas configuré. Contactez l\'administrateur.' });
    }

    let convId = conversation_id;
    const lang = isArabic(question) ? 'ar' : 'fr';

    if (convId) {
      const check = await pool.query('SELECT id FROM conversations WHERE id = $1', [convId]);
      if (check.rows.length === 0) convId = null;
    }

    if (!convId) {
      const title = question.length > 50 ? question.slice(0, 50) + '...' : question;
      const conv = await pool.query(
        'INSERT INTO conversations (user_id, title) VALUES ($1, $2) RETURNING id',
        [user.id, title]
      );
      convId = conv.rows[0].id;
    }

    await pool.query(
      'INSERT INTO messages (conversation_id, role, content) VALUES ($1, $2, $3)',
      [convId, 'user', question]
    );

    const history = await pool.query(
      'SELECT role, content FROM messages WHERE conversation_id = $1 ORDER BY id ASC',
      [convId]
    );

    const groqMessages = history.rows.map(m => ({ role: m.role, content: m.content }));

    let answer = await callGroq(groqMessages, user);

    const sql = extractSQL(answer);
    if (sql) {
      try {
        console.log('AI SQL:', sql);
        const dbResult = await pool.query(sql);
        const rows = dbResult.rows;

        const followUp = [
          ...groqMessages,
          { role: 'assistant', content: answer },
          {
            role: 'user',
            content: `I executed the SQL query and got these results:\n${JSON.stringify(rows, null, 2)}\n\nPlease provide a natural language response based on this data. Use the same language as the original question.`,
          },
        ];

        answer = await callGroq(followUp, user);
      } catch (dbErr) {
        const errorContext = [
          ...groqMessages,
          { role: 'assistant', content: answer },
          {
            role: 'user',
            content: `The SQL query failed with PostgreSQL error: ${dbErr.message}. Please explain that the query had an error and suggest what the user can ask instead. Do NOT say you lack database access — you DO have access, the SQL just had a syntax error.`,
          },
        ];
        answer = await callGroq(errorContext, user);
      }
    }

    await pool.query(
      'INSERT INTO messages (conversation_id, role, content) VALUES ($1, $2, $3)',
      [convId, 'assistant', answer]
    );

    await pool.query('UPDATE conversations SET updated_at = NOW() WHERE id = $1', [convId]);

    var docData = null;
    var docMatch = answer.match(/\[DOC:(attestation|certificat):(\{[\s\S]*?\})\]/);
    if (docMatch) {
      try {
        var parsed = JSON.parse(docMatch[2]);
        parsed.numero = (docMatch[1] === 'attestation' ? 'ATT-' : 'CERT-') + String(Date.now()).slice(-8);
        parsed.date = new Date().toLocaleDateString('fr-FR');
        if (docMatch[1] === 'certificat' && !parsed.anneeScolaire) {
          parsed.anneeScolaire = '2025/2026';
        }
        docData = { type: docMatch[1] === 'attestation' ? 'attestation_travail' : 'certificat_scolaire', data: parsed };
        answer = answer.replace(docMatch[0], '').trim();
      } catch(e) { /* ignore parse errors */ }
    }

    res.json({ answer, conversation_id: convId, document: docData });
  } catch (err) {
    console.error('Assistant Error:', err.message);
    const lang = isArabic(req.body?.question || '') ? 'ar' : 'fr';
    var userMsg;
    if (err.message.includes('429') || err.message.includes('rate_limit')) {
      userMsg = lang === 'ar'
        ? '⚠️ وصلت إلى الحد الأقصى لاستخدام API اليومي. يرجى الانتظار 30 دقيقة أو الترقية إلى اشتراك مدفوع على https://console.groq.com'
        : '⚠️ La limite quotidienne de l\'API Groq est atteinte (100 000 tokens/jour). Attendez environ 30 minutes ou passez à un abonnement payant sur https://console.groq.com.';
    } else {
      userMsg = lang === 'ar'
        ? 'عذراً، حدث خطأ. حاول مرة أخرى.'
        : 'Désolé, une erreur s\'est produite. Veuillez réessayer.';
    }
    res.status(err.message.includes('429') ? 429 : 500).json({ error: err.message, answer: userMsg });
  }
});

router.get('/conversations', authenticate, async (req, res) => {
  try {
    const user = req.user;
    const result = await pool.query(
      'SELECT id, title, created_at, updated_at FROM conversations WHERE user_id = $1 ORDER BY updated_at DESC',
      [user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.json([]);
  }
});

router.post('/conversations', authenticate, async (req, res) => {
  try {
    const user = req.user;
    const { title } = req.body;
    const result = await pool.query(
      'INSERT INTO conversations (user_id, title) VALUES ($1, $2) RETURNING id, title, created_at',
      [user.id, title || 'Nouvelle conversation']
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/conversations/:id', authenticate, async (req, res) => {
  try {
    const user = req.user;
    await pool.query('DELETE FROM conversations WHERE id = $1 AND user_id = $2', [req.params.id, user.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/conversations/:id/messages', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, role, content, created_at FROM messages WHERE conversation_id = $1 ORDER BY id ASC',
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.json([]);
  }
});

router.post('/generate-document', async (req, res) => {
  try {
    const { type, person } = req.body;
    var date = new Date().toLocaleDateString('fr-FR');
    var numero = (type === 'attestation_travail' ? 'ATT-' : 'CERT-') + String(Date.now()).slice(-8);
    var result;

    if (type === 'attestation_travail') {
      result = { employee: person.employee, poste: person.poste, date, numero };
    } else {
      result = { student: person.student, studentLatin: person.studentLatin, niveau: person.niveau, dateNaissance: person.dateNaissance, massarId: person.massarId, date, numero, anneeScolaire: '2025/2026' };
      if (person.eleve_id) {
        await pool.query('INSERT INTO certificats (eleve_id, numero, date_emission, statut) VALUES ($1, $2, CURRENT_DATE, $3)', [person.eleve_id, numero, 'généré']).catch(function() {});
      }
    }

    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/document-data', async (req, res) => {
  try {
    const { name, type } = req.body;
    if (!name || !type) return res.status(400).json({ error: 'name and type required' });

    var query, formatRow;
    if (type === 'attestation') {
      query = "SELECT id, nom, prenom, poste FROM users WHERE LOWER(nom) LIKE $1 OR LOWER(prenom) LIKE $1 OR LOWER(CONCAT(prenom,' ',nom)) LIKE $1";
      formatRow = function(r) { return { employee: r.prenom + ' ' + r.nom, poste: r.poste || 'Employé', employee_id: r.id }; };
    } else if (type === 'certificat') {
      query = "SELECT id, nom, prenom, niveau, date_naissance, id_massar FROM eleves WHERE LOWER(nom) LIKE $1 OR LOWER(prenom) LIKE $1 OR LOWER(CONCAT(prenom,' ',nom)) LIKE $1";
      formatRow = function(r) { return { student: r.nom + ' ' + r.prenom, studentLatin: r.prenom + ' ' + r.nom, niveau: r.niveau || '—', dateNaissance: r.date_naissance ? r.date_naissance.toISOString().split('T')[0] : '', massarId: r.id_massar || '', eleve_id: r.id }; };
    } else {
      return res.status(400).json({ error: 'Invalid type' });
    }

    var searchTerm = '%' + name.toLowerCase() + '%';
    var result = await pool.query(query, [searchTerm]);
    if (result.rows.length === 0 && type === 'certificat') {
      var r2 = await pool.query("SELECT eleve_name, niveau, massar_id FROM resultats WHERE LOWER(eleve_name) LIKE $1 LIMIT 1", [searchTerm]);
      if (r2.rows.length > 0) {
        var row = r2.rows[0];
        return res.json({ found: true, person: { student: row.eleve_name, studentLatin: row.eleve_name, niveau: row.niveau || '—', dateNaissance: '', massarId: row.massar_id || '', eleve_id: null }, document: { student: row.eleve_name, studentLatin: row.eleve_name, niveau: row.niveau || '—', dateNaissance: '', massarId: row.massar_id || '', eleve_id: null, date: new Date().toLocaleDateString('fr-FR'), numero: 'CERT-' + String(Date.now()).slice(-8), type: 'certificat_travail' } });
      }
    }
    if (result.rows.length === 0) return res.json({ found: false, message: 'Personne non trouvée.' });

    var persons = result.rows.map(formatRow);
    var data = persons[0];
    var date = new Date().toLocaleDateString('fr-FR');
    var numero = (type === 'attestation' ? 'ATT-' : 'CERT-') + String(Date.now()).slice(-8);

    var docData = { ...data, date, numero, type: type + '_travail' };
    res.json({ found: true, person: persons[0], document: docData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/conversations/:id/title', async (req, res) => {
  try {
    const { title } = req.body;
    await pool.query('UPDATE conversations SET title = $1, updated_at = NOW() WHERE id = $2', [title, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
