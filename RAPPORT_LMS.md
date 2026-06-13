# Rapport de transformation CMS → LMS

## 1. Base de données — nouvelles migrations

| Fichier | Description |
|---|---|
| `migrate_features.sql` | Ajout `video_url VARCHAR(255)`, `status VARCHAR(20) DEFAULT 'draft'` aux tables `courses` et `exercises` |
| `migrate_progress.sql` | Création table `course_views` (id, user_id, course_id/exercise_id, viewed_at) |
| `migrate_chat.sql` | Création table `messages` (id, sender_id, receiver_id, class_id, niveau, subject, communaute, message, created_at, read_at) avec index |

## 2. Backend — nouvelles routes

| Route | Méthodes | Rôle |
|---|---|---|
| `routes/courses.js` | POST/PUT/GET | CRUD cours avec `video_url`, `status` (draft/published), upload fichier, filtre `published` pour élèves |
| `routes/exercises.js` | POST/PUT/GET | CRUD exercices avec `video_url`, `status`, `due_date`, upload fichier, filtre `published` |
| `routes/videos.js` | POST /api/videos/upload | Upload vidéo (multer, 100 Mo) |
| `routes/progress.js` | POST /api/student/view, GET /api/teacher/progress/:courseId | Suivi de consultation par cours/exercice |
| `routes/student.js` | GET /subjects, /courses, /exercises | Vue élève : matières (via teacher_assignments), cours/exercices publiés |
| `routes/teacher.js` | GET assignments, eleves | Classes et élèves associés à l'enseignant |

## 3. Backend — temps réel (Socket.IO)

- **`socket/index.js`** : Connexion socket avec auth JWT, événements :
  - `send_message` — message privé ou de classe (communautaire)
  - `get_conversations` / `get_conversation` — historique des conversations
  - `get_class_feed` — fil de classe (avec paramètre classe optionnel pour enseignants)
  - `get_teachers` / `get_students` / `get_teacher_classes` — listes de contacts
  - `mark_read` — marquer comme lu
  - `typing` / `stop_typing` — indicateur de saisie
- **`index.js`** : Restructuré avec `http.createServer` + `Server` socket.io au lieu de `app.listen`

## 4. Backend — autres modifications

- **`routes/school.js`** : `GET /search?q=`, `PUT /:id/link-user` pour lier un élève à un compte utilisateur
- **`routes/auth.js`** : Signup auto pour élèves (email/password générés), permissions `courses:manage`, `students:read` pour enseignants
- **`middlewares/auth.js`** : Ajout rôles `enseignant` et `eleve` dans `ROLE_MAP` / `ROLE_PERMISSIONS`
- **`routes/documents.js`**, **`routes/users.js`**, **`schema.sql`** : Ajustements divers compatibilité LMS

## 5. Frontend — composants du LMS

| Composant | Description |
|---|---|
| `TeacherModule.jsx` | Interface enseignant : sélection niveau→matière→cours, EditorModal (ReactQuill + upload vidéo + boutons Publier/Sauvegarder brouillon), badges de statut, bouton 👁️ pour voir qui a consulté (ProgressModal) |
| `StudentModule.jsx` | Interface élève : détail cours avec ReactPlayer, DOMPurify, export PDF, auto `POST /student/view` |
| `ChatDrawer.jsx` | Panneau coulissant : onglets Messages privés + Fil de classe, sélecteur de classe pour enseignant, indicateur de saisie, accusé de lecture ✓✓ |

## 6. Frontend — contexte Socket.IO

- **`SocketContext.jsx`** : Contexte React avec connexion socket.io-client, état global (conversations, non lus, classFeed, teachers, students, teacherClasses), fonctions sendMessage/markAsRead/loadConversation/refreshClassFeed/refreshTeachers/refreshTeacherClasses/loadStudents

## 7. Frontend — intégration UI

- **`Navbar.jsx`** : Icône 💬 avec badge de non-lus (visible pour enseignants et élèves uniquement)
- **`Sidebar.jsx`** : Lien "Messages" (visible pour enseignants et élèves uniquement)
- **`App.jsx`** : Wrapper `SocketProvider`, intégration `ChatDrawer`, props `chatUnread` passée à Navbar
- **`Dashboard.jsx`** : Redirection des élèves vers `/student`

## 8. Frontend — fonctionnalités supplémentaires

- **`pdfExport.js`** : Utilitaire `exportToPdf(elementRef, filename)` avec jspdf + html2canvas
- **`UserManagement.jsx`** : Filtre `eleve`, AssignModal, LinkStudentModal
- **`Profile.jsx`** : Section infos pro masquée pour non-RH

## 9. Traductions

- **`fr/translation.json`** : Nouvelles sections `teacher.*`, `student.*`, `chat.*`, `users.eleve`, clés sidebar `messages`

## 10. Packages installés

| Package | Version | Projet |
|---|---|---|
| `react-quill-new` | 3.8.3 | Frontend — éditeur rich text |
| `react-player` | 3.4.0 | Frontend — lecteur vidéo |
| `dompurify` | 3.4.9 | Frontend (via jspdf) — nettoyage HTML |
| `socket.io-client` | 4.8.3 | Frontend — socket client |
| `socket.io` | 4.8.3 | Backend — socket serveur |

## 11. Correctifs appliqués

- **Ouverture de conversation** : Utilisation de `other_id || id` pour gérer correctement les conversations venant de la liste (`other_id`) vs les nouveaux contacts (`id`)
- **Sélecteur de classe enseignant** : Ajout dans l'onglet Fil de classe + bouton Nouveau message
- **Permissions UI** : Masquage du bouton messagerie pour les rôles non-concernés (admin, RH, finance…)
- **Credential auto** : Génération email `normalise(prenom+nom)@borjazzaitoune.ma` et mot de passe `id_massar` pour les élèves
