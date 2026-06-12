const http = require('http');

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const AI_MODEL = process.env.AI_MODEL || 'phi3:mini';

const SCHEMA_FIELDS = [
  'id_massar', 'nom', 'prenom', 'classe', 'niveau',
  'date_naissance', 'email_parent', 'telephone_parent'
];

function buildPrompt(headers) {
  return `Tu es un assistant qui mappe des en-têtes de fichier Excel vers un schéma de base de données.
Schéma attendu (champs possibles) : ${SCHEMA_FIELDS.join(', ')}
En-têtes du fichier : ${headers.join(', ')}

Pour chaque en-tête, détermine à quel champ du schéma il correspond.
Retourne UNIQUEMENT un objet JSON valide (pas de texte avant/après) comme :
{"Header1": "nom", "Header2": "email_parent", ...}

Si un en-tête ne correspond à aucun champ, utilise null comme valeur.
Assure-toi que les clés sont exactement les en-têtes originaux tels que fournis.`;
}

async function mapColumns(headers) {
  if (!headers || headers.length === 0) return null;

  const url = new URL('/api/generate', OLLAMA_URL);

  const prompt = buildPrompt(headers);
  const body = JSON.stringify({
    model: AI_MODEL,
    prompt,
    stream: false,
    temperature: 0.1,
    format: 'json'
  });

  return new Promise((resolve) => {
    const req = http.request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      },
      timeout: 30000
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          const responseText = parsed.response || '';
          const mapping = JSON.parse(responseText);
          const valid = {};
          let count = 0;
          for (const [header, field] of Object.entries(mapping)) {
            if (field && SCHEMA_FIELDS.includes(field)) {
              valid[field] = header;
              count++;
            }
          }
          if (count === 0) return resolve(null);
          resolve({ mapping: valid, unmapped: headers.filter(h => !Object.values(valid).includes(h)) });
        } catch {
          resolve(null);
        }
      });
    });

    req.on('error', () => resolve(null));
    req.on('timeout', () => { req.destroy(); resolve(null); });
    req.write(body);
    req.end();
  });
}

const STATIC_MAP = {
  "massar": "id_massar", "id massar": "id_massar", "code massar": "id_massar",
  "nom": "nom", "nom de famille": "nom",
  "prénom": "prenom", "prenom": "prenom",
  "classe": "classe",
  "niveau": "niveau",
  "date naissance": "date_naissance", "date de naissance": "date_naissance",
  "email parent": "email_parent", "email_parent": "email_parent",
  "téléphone parent": "telephone_parent", "telephone parent": "telephone_parent",
};

function fallbackMapping(headers) {
  const mapping = {};
  const unmapped = [];
  for (const h of headers) {
    const f = STATIC_MAP[h.toLowerCase().trim()] || null;
    if (f) mapping[f] = h;
    else unmapped.push(h);
  }
  return { mapping, unmapped, source: 'fallback' };
}

module.exports = { mapColumns, fallbackMapping, SCHEMA_FIELDS };
