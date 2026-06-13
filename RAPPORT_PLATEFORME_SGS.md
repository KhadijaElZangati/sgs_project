# Rapport Technique et Fonctionnel — Plateforme SGS (Système de Gestion Scolaire)

---

## 1. Présentation Générale

**SGS (Système de Gestion Scolaire)** est une application web complète de gestion d'établissement scolaire destinée au **Collège Borj Azaitoune – Marrakech**.

**Architecture technique :**
- **Frontend :** React 18 + Vite + Tailwind CSS (port 5173)
- **Backend :** Node.js + Express (port 5000)
- **Base de données :** PostgreSQL (`sgs_db`)
- **Serveur BD :** localhost, utilisateur `sgs_admin`, mot de passe `sgs_pass_2026`

---

## 2. Structure de la Base de Données

### 2.1 Tables et leurs rôles

| Table | Rôle |
|---|---|
| **users** | Comptes utilisateurs (employés, admin, etc.) |
| **eleves** | Fiche des élèves inscrits |
| **demandes_rh** | Demandes RH (congés, attestations) |
| **operations** | Opérations financières (revenus/dépenses) |
| **resultats** | Notes et résultats scolaires (importés depuis Excel) |
| **certificats** | Certificats de scolarité générés |
| **dossiers** | Dossiers individuels/collectifs des élèves |
| **notifications** | Notifications système (validation RH, etc.) |

### 2.2 Schéma détaillé des tables

**users** — Comptes utilisateurs
```sql
id              SERIAL PRIMARY KEY
nom             VARCHAR(100) NOT NULL
prenom          VARCHAR(100)
role            VARCHAR(20)       -- 'admin', 'direction', 'service_financier', 'surveillant', 'employe'
email           VARCHAR(150) UNIQUE NOT NULL
actif           BOOLEAN DEFAULT true
initiales       VARCHAR(5)
poste           VARCHAR(100)
matricule       VARCHAR(50)
solde_conge     INTEGER DEFAULT 12
password        VARCHAR(255)
```

**eleves** — Élèves
```sql
id                    SERIAL PRIMARY KEY
id_massar             VARCHAR(20) UNIQUE
nom                   VARCHAR(100) NOT NULL
prenom                VARCHAR(100) NOT NULL
classe                VARCHAR(50)
niveau                VARCHAR(50)
date_naissance        DATE
absences              INTEGER DEFAULT 0
absences_justifiees   INTEGER DEFAULT 0
```

**demandes_rh** — Demandes RH
```sql
id              SERIAL PRIMARY KEY
employe_id      INTEGER REFERENCES users(id)
type            VARCHAR(50)       -- 'attestation_travail', 'conge_maladie', 'conge_exceptionnel'
statut          VARCHAR(20) DEFAULT 'en_attente'  -- 'en_attente', 'approuvé', 'rejeté'
date_creation   DATE DEFAULT CURRENT_DATE
date_debut      DATE
date_fin        DATE
motif           TEXT
piece_jointe    VARCHAR(255)
commentaire     TEXT
```

**operations** — Opérations financières
```sql
id              SERIAL PRIMARY KEY
type            VARCHAR(10)       -- 'revenu' ou 'depense'
categorie       VARCHAR(50)
description     TEXT
montant         NUMERIC(12,2) NOT NULL
date            DATE DEFAULT CURRENT_DATE
statut          VARCHAR(20) DEFAULT 'en_attente'  -- 'valide', 'en_attente'
saisie_par      INTEGER REFERENCES users(id)
```

**resultats** — Résultats scolaires
```sql
id                    SERIAL PRIMARY KEY
massar_id             VARCHAR(50)
eleve_name            VARCHAR(255)
niveau                VARCHAR(10)     -- '1AC', '2AC', '3AC'
trimestre             INTEGER
maths                 NUMERIC(4,2)
physique              NUMERIC(4,2)
svt                   NUMERIC(4,2)
francais              NUMERIC(4,2)
arabe                 NUMERIC(4,2)
anglais               NUMERIC(4,2)
histoire_geo          NUMERIC(4,2)
education_islamique   NUMERIC(4,2)
informatique          NUMERIC(4,2)
eps                   NUMERIC(4,2)
musique               NUMERIC(4,2)
art                   NUMERIC(4,2)
moyenne_generale      NUMERIC(4,2)
date_import           TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

**certificats** — Certificats de scolarité
```sql
id              SERIAL PRIMARY KEY
eleve_id        INTEGER REFERENCES eleves(id) ON DELETE CASCADE
numero          VARCHAR(50) UNIQUE NOT NULL
date_emission   DATE DEFAULT CURRENT_DATE
annee_scol      VARCHAR(20)
statut          VARCHAR(20) DEFAULT 'emis'
```

---

## 3. Architecture des Rôles et Permissions

### 3.1 Les 5 rôles système

| Rôle (DB) | Rôle (Frontend) | Persona |
|---|---|---|
| `admin` | `administrateur` | Super-administrateur (direction informatique / chef d'établissement) |
| `direction` | `direction` | Direction de l'établissement |
| `service_financier` | `service_financier` | Comptable / service financier |
| `surveillant` | `surveillant_general` | Surveillant général / CPE |
| `employe` | `employe` | Employé / enseignant |

### 3.2 Tableau des permissions par rôle

| Permission | admin | direction | service_financier | surveillant | employe |
|---|---|---|---|---|---|
| **RH** | | | | | |
| `hr:read_own` (voir ses demandes) | ✅ | ✅ | ❌ | ❌ | ✅ |
| `hr:read_all` (voir toutes les demandes) | ✅ | ✅ | ❌ | ❌ | ❌ |
| `hr:validate` (approuver/rejeter) | ✅ | ✅ | ❌ | ❌ | ❌ |
| `hr:create_request` (créer une demande) | ✅ | ❌ | ❌ | ❌ | ✅ |
| **Finance** | | | | | |
| `finance:read` (consulter opérations) | ✅ | ✅ | ✅ | ❌ | ❌ |
| `finance:manage_expense` (gérer dépenses) | ✅ | ❌ | ✅ | ❌ | ❌ |
| `finance:manage_revenue` (gérer revenus) | ✅ | ❌ | ✅ | ❌ | ❌ |
| `finance:generate_bilan` (générer bilan) | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Vie Scolaire** | | | | | |
| `students:read` (voir élèves) | ✅ | ✅ | ❌ | ✅ | ❌ |
| `students:manage` (gérer absences) | ✅ | ✅ | ❌ | ✅ | ❌ |
| **Documents** | | | | | |
| `certificates:generate` (certificats) | ✅ | ✅ | ❌ | ❌ | ❌ |
| `grades:manage` (importer notes) | ✅ | ❌ | ❌ | ❌ | ❌ |
| `grades:read` (voir notes) | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Admin** | | | | | |
| `users:manage` (gérer utilisateurs) | ✅ | ❌ | ❌ | ❌ | ❌ |

### 3.3 Règles spéciales

- **Administrateur** : possède TOUTES les permissions (court-circuit systématique dans `hasPermission()`) — peut tout faire, tout voir.
- **Le menu "Vie Scolaire" est caché pour l'administrateur** (`excludeAdmin: true` dans la Sidebar), car ce module est destiné au personnel de terrain.
- **Un employé ne peut PAS créer de demande si son rôle est `administrateur`** (le bouton "Nouvelle Demande" est explicitement masqué pour ce rôle).

---

## 4. Modules Fonctionnels — Détail complet

### 4.1 Module RH (Ressources Humaines) — `/rh/*`

**Accès :** Tous les rôles sauf `service_financier` et `surveillant_general`

#### Sous-routes

| Route | Composant | Fonctionnalité | Permissions requises |
|---|---|---|---|
| `/rh/list` | `RHRequestsList` | Liste des demandes RH. Admin voit tout, employé voit ses propres demandes. Impression des Attestations de Travail approuvées. | `hr:read_own` ou `hr:read_all` |
| `/rh/new` | `NewRHRequest` | Formulaire de création de demande (3 types). | `hr:create_request` (caché pour admin) |
| `/rh/validation` | `RHValidation` | File d'attente : approuver ou rejeter les demandes en attente. | `hr:validate` |

#### Types de demandes

| Type | Libellé | Affiche dates ? |
|---|---|---|
| `attestation_travail` | Attestation de Travail | ❌ Pas besoin de dates |
| `conge_maladie` | Congé Maladie | ✅ Date début + Date fin |
| `conge_exceptionnel` | Congé Exceptionnel | ✅ Date début + Date fin |

#### Workflow de validation

1. L'employé crée une demande via `/rh/new`
2. La demande apparaît avec le statut `en attente`
3. L'admin ou la direction voit la demande dans `/rh/validation`
4. Clique sur **Approuver** → statut passe à `approuvé`, notification créée pour l'employé
5. Clique sur **Rejeter** → statut passe à `rejeté`, notification créée pour l'employé
6. Pour une Attestation de Travail approuvée, l'admin peut cliquer sur **Imprimer** pour générer le document officiel

#### Template d'impression (Attestation de Travail)

Le document imprimé contient :
- En-tête : Royaume du Maroc, Ministère de l'Éducation Nationale, Collège Borj Azaitoune
- Titre : "Attestation de Travail"
- Corps : "Je soussigné, Directeur du Collège Borj Azaitoune, certifie que M/Mme [Nom] est bel et bien employé(e)..."
- Pied de page : Date, signature et cachet du Directeur

---

### 4.2 Module Finance — `/finance/*`

**Accès :** `service_financier`, `direction`, `administrateur`

#### Sous-routes

| Route | Composant | Fonctionnalité | Permissions |
|---|---|---|---|
| `/finance/list` | `OperationsList` | Liste complète des opérations avec filtres (type, recherche). Totaux (revenus, dépenses, solde). | `finance:read` |
| `/finance/new` | `NewOperation` | Formulaire de création d'opération (type revenu/dépense, catégorie, description, montant, date). | `finance:manage_expense` ou `finance:manage_revenue` |
| `/finance/report` | `BilanReport` | Bilan financier complet : total revenus, total dépenses, solde, détail par catégorie. | `finance:generate_bilan` |

#### Catégories d'opérations

**Revenus :** Inscription, Frais Scolaires, Subventions, Dons, Autre
**Dépenses :** Maintenance, Matériel, Salaires, Électricité, Eau, Fournitures, Autre

---

### 4.3 Module Vie Scolaire — `/school-life/*`

**Accès :** `surveillant_general`, `direction`, `administrateur`

#### Sous-routes

| Route | Composant | Fonctionnalité | Permissions |
|---|---|---|---|
| `/school-life/students` | `StudentsList` | Liste des élèves avec recherche (nom, prénom, code MASSAR). Vue consolidée des élèves de la BD + ceux importés des résultats. | `students:read` |
| `/school-life/absences` | `AbsencesManager` | Gestion des absences modifiables champ par champ (absences / justifiées), avec bouton "Sauvegarder" par élève. | `students:manage` |

#### Source de données élèves

Les élèves proviennent de deux sources fusionnées :
1. **Table `eleves`** (BD principale) — élèves officiellement inscrits
2. **Table `resultats`** — élèves importés via Excel (identifiés par `massar_id` et `eleve_name`) qui n'existent pas encore dans `eleves`

---

### 4.4 Module Documents Scolaires — `/documents/*`

**Accès :** `administrateur`, `direction` (selon sous-permissions)

#### Sous-routes

| Route | Composant | Fonctionnalité | Permissions |
|---|---|---|---|
| `/documents/results` | `ResultsManagement` | Import Excel des notes, visualisation par niveau/trimestre, statistiques (moyenne, taux de réussite). | `grades:manage` OU `students:read` |
| `/documents/certificates` | `CertificatesManagement` | Génération de certificats de scolarité bilingues (arabe/français) avec impression. | `certificates:generate` |

#### Import des résultats (Excel)

Le fichier Excel doit contenir les colonnes : `ID` (MASSAR), `Prenom`, `Nom`, `Mathematiques`, `Physique-Chimie`, `SVT`, `Francais`, `Arabe`, `Anglais`, `Histoire-Geographie`, `Education Islamique`, `Informatique`, `EPS`, `Musique`, `Art`.

L'application calcule automatiquement la moyenne générale à partir des notes valides (> 0).

#### Générateur de certificat de scolarité

Le certificat est bilingue (français/arabe, aligné à droite `rtl`) avec :
- En-tête : Royaume du Maroc, Ministère, Académie régionale, Direction provinciale
- Informations : Nom, prénom, date naissance, code MASSAR, niveau, année scolaire
- Emplacements pour photo, cachet du directeur, cachet du surveillant général
- Mention "MASSAR" comme système de référence

---

### 4.5 Administration / Gestion des utilisateurs — `/admin/users`

**Accès réservé :** `administrateur` uniquement (`users:manage`)

| Fonctionnalité | Description |
|---|---|
| **Liste des utilisateurs** | Tableau avec nom, prénom, email, rôle, statut (actif/inactif), initiales |
| **Création d'utilisateur** | Formulaire : prénom, nom, email, mot de passe temporaire, rôle |
| **Rôles disponibles** | Administrateur, Direction, Service Financier, Surveillant Général, Employé |

**Note technique :** Le rôle sélectionné dans le formulaire frontend (`administrateur`) est converti en rôle DB (`admin`) via un mapping inversé avant insertion.

---

### 4.6 Dashboard personnalisé — `/dashboard`

#### AdminDashboard
- **Indicateurs :** Nombre de comptes, RH à valider, Revenus mensuels, Nombre d'élèves
- **Demandes RH :** Vue globale des 5 dernières demandes avec lien "Traiter →"
- **Tâches rapides :** Valider RH, Gérer utilisateurs, Certificats

#### DirectionDashboard
- **Indicateurs :** Élèves, Personnel, RH en attente, Solde financier
- **Aperçu financier :** Revenus, Dépenses, Opérations
- **Accès rapide :** Valider RH, Finance, Certificats

#### FinanceDashboard
- **Indicateurs :** Revenus, Dépenses, Solde
- **Actions rapides :** Nouvelle opération, Voir opérations, Bilan

#### SurveillantDashboard
- **Indicateurs :** Élèves, Niveaux, Absences totales
- **Actions rapides :** Liste des élèves, Gérer absences

#### EmployeeDashboard
- **Indicateurs :** Dernières demandes RH de l'utilisateur
- **Stats :** En attente / Approuvé / Rejeté
- **Actions rapides :** Attestation de Travail, Congé Maladie

---

## 5. API Backend — Toutes les Routes

### 5.1 Routes d'authentification

| Méthode | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/login` | Authentification (email + password). Retourne un token "mock" + utilisateur avec permissions. |
| `POST` | `/api/auth/signup` | Création d'un nouvel utilisateur (par l'admin). |

### 5.2 Routes Dashboard

| Méthode | Endpoint | Description |
|---|---|---|
| `GET` | `/api/dashboard/stats` | Statistiques globales (utilisateurs, élèves, revenus, certificats, 5 dernières demandes RH). |
| `GET` | `/api/dashboard/finance-stats` | Statistiques financières (total revenus, dépenses, solde, nombre d'opérations). |
| `GET` | `/api/dashboard/eleves-stats` | Statistiques élèves (total, niveaux distincts, somme des absences). |

### 5.3 Routes RH

| Méthode | Endpoint | Description |
|---|---|---|
| `GET` | `/api/demandes-rh` | Liste de toutes les demandes RH avec noms des employés (JOIN). |
| `POST` | `/api/demandes-rh` | Création d'une demande RH (statut initial : `en attente`). |
| `PUT` | `/api/demandes-rh/:id` | Mise à jour du statut + commentaire + création de notification automatique pour l'employé. |

### 5.4 Routes Élèves / Vie scolaire

| Méthode | Endpoint | Description |
|---|---|---|
| `GET` | `/api/eleves` | Liste des élèves depuis la table `eleves`. |
| `GET` | `/api/eleves/all` | Liste consolidée : élèves BD + élèves importés des résultats. |
| `PUT` | `/api/eleves/:id/absences` | Mise à jour des absences et absences justifiées. |

### 5.5 Routes Finance

| Méthode | Endpoint | Description |
|---|---|---|
| `GET` | `/api/operations` | Liste de toutes les opérations financières. |
| `POST` | `/api/operations` | Création d'une opération financière (statut initial : `validé`). |

### 5.6 Routes Documents

| Méthode | Endpoint | Description |
|---|---|---|
| `GET` | `/api/resultats` | Liste de tous les résultats scolaires. |
| `POST` | `/api/resultats/upload` | Import en masse des résultats depuis Excel. |
| `GET` | `/api/certificats` | Liste des certificats de scolarité. |
| `POST` | `/api/certificats/generate` | Génération d'un certificat (crée l'élève dans `eleves` si nécessaire). |

### 5.7 Routes Utilisateurs

| Méthode | Endpoint | Description |
|---|---|---|
| `GET` | `/api/users` | Liste de tous les utilisateurs (pour l'admin). |

### 5.8 Routes Notifications

| Méthode | Endpoint | Description |
|---|---|---|
| `GET` | `/api/notifications/user/:id` | Top 10 notifications non lues pour un utilisateur. |
| `PUT` | `/api/notifications/:id/read` | Marquer une notification comme lue. |

---

## 6. Navigation et Interface

### 6.1 Menu latéral (Sidebar)

| Menu | Route | Visible pour |
|---|---|---|
| Tableau de Bord | `/dashboard` | Tous |
| Ressources Humaines | `/rh` | admin, direction, employe |
| Gestion Financière | `/finance` | admin, direction, service_financier |
| Vie Scolaire | `/school-life` | direction, surveillant (caché pour admin via `excludeAdmin`) |
| Documents Scolaires | `/documents` | admin, direction |
| Administration | `/admin/users` | admin uniquement |

### 6.2 Structure des routes frontend

| Route | Composant | Garde d'accès |
|---|---|---|
| `/login` | `Login` | Public |
| `/dashboard` | `Dashboard` | Authentifié |
| `/rh/*` | `RHModule` | `hr:read_own` ou `hr:read_all` |
| `/finance/*` | `FinanceModule` | `finance:read` ou `finance:manage_expense` ou `finance:manage_revenue` |
| `/school-life/*` | `SchoolLifeModule` | `students:read` ou `students:manage` |
| `/documents/*` | `DocumentsModule` | `certificates:generate` ou `grades:manage` ou `students:read` |
| `/admin/users` | `UserManagement` | `user.role === 'administrateur'` |
| `*` (défaut) | Redirection → `/login` | Non authentifié |

### 6.3 Composants communs

- **Navbar :** Logo SGS, nom/prénom de l'utilisateur, rôle, menu déroulant avec "Mon Profil" et "Déconnexion"
- **Sidebar :** Menu latéral responsive (caché sur mobile, rétractable), fond gris foncé avec dégradé, surlignage bleu de la page active
- **Notifications :** Système de toast (popup de notification avec auto-disparition à 5 secondes), types : info (bleu) et error (rouge)

---

## 7. Points Techniques Notables

### 7.1 Sécurité et authentification

- **Mots de passe en clair** : stockés et comparés sans hachage (à migrer vers bcrypt)
- **Token JWT factice** : `mock-jwt-token-sgs-2026` — pas de vérification côté serveur
- **Aucun middleware d'authentification** sur les routes API (tout le monde peut théoriquement appeler n'importe quelle route)
- **Permissions côté client uniquement** : le fichier `rbac.js` existe mais n'est jamais importé ; le contrôle d'accès repose sur les permissions stockées dans `localStorage`

### 7.2 Gestion des erreurs

- La plupart des routes renvoient des valeurs par défaut (tableaux vides, zéros) plutôt que des erreurs HTTP — approche "graceful degradation"
- Les erreurs sont loggées dans la console backend mais rarement exposées

### 7.3 Données et flux

- **Import Excel** : utilisation de la bibliothèque `xlsx` côté frontend pour parser les fichiers, envoi des données structurées au backend
- **Notifications** : créées automatiquement lors des actions de validation RH (côté backend avec `NOW()`)
- **Fusion élèves** : l'endpoint `/api/eleves/all` combine la table `eleves` et les inscriptions de `resultats` qui n'ont pas encore d'entrée dans `eleves`

### 7.4 Limitations connues / axes d'amélioration

1. **Sécurité des mots de passe** : implémenter bcrypt ou un autre algorithme de hachage
2. **Authentification JWT réelle** : vérifier le token sur chaque requête
3. **Permissions côté serveur** : intégrer et utiliser le middleware `rbac.js`
4. **Route `/api/resultats/upload` dupliquée** deux fois dans `index.js` (lignes 406 et 442) — à dédupliquer
5. **Pas de pagination** sur les listes (élèves, opérations, demandes RH)
6. **Pas de modification/suppression d'utilisateurs** dans l'interface admin (création uniquement)
7. **Le menu "Vie Scolaire" est caché pour l'admin** (`excludeAdmin: true`) mais l'admin y a techniquement accès via l'URL directe

---

## 8. Comptes de démonstration (données du dump)

| Email | Mot de passe | Rôle | Nom complet |
|---|---|---|---|
| `admin@sgs.ma` | `password` | Administrateur | Zangati Enseignant |
| `direction@sgs.ma` | `password` | Direction | Mohammed Al-Fassi |
| `employe1@sgs.ma` | `password` | Employé | Hassan Benali |
| `employe2@sgs.ma` | `password` | Employé | Karima Ouahbi |
| `surveillant@sgs.ma` | `password` | Surveillant | Younes Benkirane |
| `financier@sgs.ma` | `password` | Service Financier | Ezzahra El zangati |

---

## 9. Résumé visuel — Parcours utilisateur par rôle

```
                    ┌─────────────────────────────────────────────────────────────────┐
                    │                    SGS — Système de Gestion Scolaire             │
                    └─────────────────────────────────────────────────────────────────┘
                                         │
                    ┌────────────────────┼────────────────────┬──────────────────┐
                    │                    │                    │                  │
              ┌─────▼──────┐    ┌────────▼───────┐    ┌──────▼──────┐    ┌────▼─────┐
              │ EMPLOYÉ    │    │ DIRECTION       │    │ FINANCIER   │    │ SURVEILLANT│
              │ (enseignant)│    │                 │    │             │    │           │
              └─────┬──────┘    └────────┬───────┘    └──────┬──────┘    └────┬─────┘
                    │                    │                    │                  │
  ┌─────────────┐   │                    │                    │                  │
  │ Dashboard   │   │ • Stats RH         │ • Stats élèves    │ • Stats          │ • Stats élèves │
  │ personnel   │   │ • Mes demandes     │ • RH en attente   │   financières    │ • Absences     │
  └─────────────┘   │ • Actions rapides  │ • Solde financier │                  │                 │
                    │                    │                    │                  │
  ┌─────────────┐   │                    │                    │                  │
  │ RH          │   │ • Créer demande    │ • Valider toutes   │ ❌               │ ❌              │
  │             │   │ • Voir ses demandes│   les demandes      │                  │                 │
  └─────────────┘   │                    │                    │                  │
                    │                    │                    │                  │
  ┌─────────────┐   │                    │                    │                  │
  │ Finance     │   │ ❌                 │ • Voir opérations  │ • CRUD complet   │ ❌              │
  │             │   │                    │ • Bilan            │ • Bilan          │                 │
  └─────────────┘   │                    │                    │                  │
                    │                    │                    │                  │
  ┌─────────────┐   │                    │                    │                  │
  │ Vie Scolaire│   │ ❌                 │ • Élèves           │ ❌               │ • Élèves       │
  │             │   │                    │ • Absences         │                  │ • Absences     │
  └─────────────┘   │                    │                    │                  │
                    │                    │                    │                  │
  ┌─────────────┐   │                    │                    │                  │
  │ Documents   │   │ ❌                 │ • Certificats      │ ❌               │ ❌              │
  └─────────────┘   │                    │                    │                  │
                    │                    │                    │                  │
              ┌─────▼────────────────────▼────────────────────▼──────────────────▼─────┐
              │                    ADMINISTRATEUR (accès total)                        │
              │  Dashboard global │ RH (tout voir + valider) │ Finance (tout)         │
              │  Vie Scolaire (tout) │ Documents (tout) │ Gestion utilisateurs       │
              └──────────────────────────────────────────────────────────────────────┘
```

---

*Document généré le 07/06/2026 — SGS v1.0 — Collège Borj Azaitoune, Marrakech*
