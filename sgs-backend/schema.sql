-- Users & Staff Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100),
    role VARCHAR(20),
    email VARCHAR(150) UNIQUE NOT NULL,
    actif BOOLEAN DEFAULT TRUE,
    initiales VARCHAR(5),
    poste VARCHAR(100),
    matricule VARCHAR(50),
    solde_conge INTEGER DEFAULT 12,
    password VARCHAR(255),
    photo VARCHAR(255),
    telephone VARCHAR(20),
    adresse TEXT,
    date_naissance DATE,
    lieu_naissance VARCHAR(100),
    cin VARCHAR(20),
    cnss VARCHAR(20),
    date_embauche DATE,
    diplome VARCHAR(100),
    specialite VARCHAR(100),
    sexe VARCHAR(10)
);

-- Students Table (Eleves)
CREATE TABLE eleves (
    id SERIAL PRIMARY KEY,
    id_massar VARCHAR(20) UNIQUE,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    classe VARCHAR(50),
    niveau VARCHAR(50),
    date_naissance DATE,
    absences INTEGER DEFAULT 0,
    absences_justifiees INTEGER DEFAULT 0,
    email_parent VARCHAR(150),
    telephone_parent VARCHAR(20)
);

-- Human Resources Requests (Demandes RH)
CREATE TABLE demandes_rh (
    id SERIAL PRIMARY KEY,
    employe_id INTEGER REFERENCES users(id),
    type VARCHAR(50),
    statut VARCHAR(20) DEFAULT 'en_attente',
    date_creation DATE DEFAULT CURRENT_DATE,
    date_debut DATE,
    date_fin DATE,
    motif TEXT,
    piece_jointe VARCHAR(255),
    commentaire TEXT
);

-- Financial Operations
CREATE TABLE operations (
    id SERIAL PRIMARY KEY,
    type VARCHAR(10),
    categorie VARCHAR(50),
    description TEXT,
    montant DECIMAL(12, 2) NOT NULL,
    date DATE DEFAULT CURRENT_DATE,
    statut VARCHAR(20) DEFAULT 'en_attente',
    saisie_par INTEGER REFERENCES users(id)
);

-- Certificates
CREATE TABLE certificats (
    id SERIAL PRIMARY KEY,
    eleve_id INTEGER REFERENCES eleves(id),
    numero VARCHAR(50) NOT NULL,
    date_emission DATE DEFAULT CURRENT_DATE,
    annee_scol VARCHAR(20),
    statut VARCHAR(20) DEFAULT 'emis'
);

-- Notifications
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    type VARCHAR(20),
    message TEXT NOT NULL,
    temps TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    lu BOOLEAN DEFAULT FALSE
);

-- Dossiers (student files)
CREATE TABLE dossiers (
    id SERIAL PRIMARY KEY,
    type VARCHAR(20),
    titre VARCHAR(200) NOT NULL,
    eleve_id INTEGER REFERENCES eleves(id),
    classe VARCHAR(50),
    date DATE DEFAULT CURRENT_DATE,
    statut VARCHAR(20) DEFAULT 'ouvert',
    transmis BOOLEAN DEFAULT FALSE,
    destinataire VARCHAR(50)
);

-- Absence Records (per-date absence tracking)
CREATE TABLE absence_records (
    id SERIAL PRIMARY KEY,
    eleve_id INTEGER REFERENCES eleves(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    justifie BOOLEAN DEFAULT FALSE,
    motif TEXT,
    justificatif TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Academic Results (Resultats)
CREATE TABLE resultats (
    id SERIAL PRIMARY KEY,
    massar_id VARCHAR(50),
    eleve_name VARCHAR(255),
    niveau VARCHAR(10),
    trimestre INTEGER,
    maths DECIMAL(4, 2),
    physique DECIMAL(4, 2),
    svt DECIMAL(4, 2),
    francais DECIMAL(4, 2),
    arabe DECIMAL(4, 2),
    anglais DECIMAL(4, 2),
    histoire_geo DECIMAL(4, 2),
    education_islamique DECIMAL(4, 2),
    informatique DECIMAL(4, 2),
    eps DECIMAL(4, 2),
    musique DECIMAL(4, 2),
    art DECIMAL(4, 2),
    moyenne_generale DECIMAL(4, 2),
    date_import TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
