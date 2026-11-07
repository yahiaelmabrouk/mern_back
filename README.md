# TaskFlow PME — API (Backend)

API REST **Node.js / Express** + **MongoDB (Mongoose)**, sécurisée par **JWT**, pour l'application de suivi de tâches d'entreprise *TaskFlow PME*.

> Le client React se trouve dans le dossier [`../front`](../front/README.md).

## Sommaire

- [Stack technique](#stack-technique)
- [Prérequis](#prérequis)
- [Installation](#installation)
- [Variables d'environnement](#variables-denvironnement)
- [Scripts](#scripts)
- [Structure du projet](#structure-du-projet)
- [Modèles de données](#modèles-de-données)
- [Authentification](#authentification)
- [Endpoints de l'API](#endpoints-de-lapi)
- [Exemples de requêtes](#exemples-de-requêtes)
- [Déploiement](#déploiement)

## Stack technique

| Rôle | Outil |
|---|---|
| Serveur HTTP | Express 4 |
| Base de données | MongoDB + Mongoose 8 |
| Authentification | JSON Web Token (`jsonwebtoken`) |
| Hachage des mots de passe | `bcryptjs` |
| CORS / configuration | `cors` · `dotenv` |

## Prérequis

- **Node.js ≥ 18**
- Une base **MongoDB** : instance locale ou cluster [MongoDB Atlas](https://www.mongodb.com/atlas)

## Installation

```bash
cd backend
npm install
cp .env.example .env     # puis renseigner les valeurs (voir ci-dessous)
npm run dev              # ou : npm start
```

Le serveur démarre sur **http://localhost:5000** (port configurable).

Au premier lancement, si la base est vide, un jeu de données de démonstration est créé :

| Email | Mot de passe | Rôle |
|---|---|---|
| `admin@pme.tn` | `123456` | Admin |

> ⚠️ Compte réservé au développement : à supprimer ou à modifier avant une mise en production réelle.

## Variables d'environnement

Copier [`.env.example`](.env.example) en `.env`. Ce fichier est ignoré par Git : **ne jamais le pousser sur GitHub**.

| Variable | Obligatoire | Description |
|---|---|---|
| `PORT` | Non (`5000`) | Port d'écoute du serveur. |
| `MONGODB_URI` | Non (`mongodb://127.0.0.1:27017/taskflow`) | URI de connexion MongoDB (locale ou Atlas `mongodb+srv://...`). |
| `JWT_SECRET` | **Oui en production** | Secret de signature des tokens. En développement, une valeur par défaut est utilisée ; en production, le serveur refuse de démarrer sans elle. |
| `CLIENT_URL` | Production | Origine autorisée par CORS (URL du front, **sans `/` final**). Si absente, toutes les origines sont acceptées. |
| `NODE_ENV` | Production | Mettre `production` en ligne. |

## Scripts

| Commande | Action |
|---|---|
| `npm start` | Lance le serveur (`node server.js`). |
| `npm run dev` | Lance le serveur avec rechargement automatique (`node --watch`). |

## Structure du projet

```
backend/
├── server.js              Configuration Express, CORS, montage des routes,
│                          connexion MongoDB et données de démonstration
├── middleware/
│   └── protect.js         Vérification du JWT (Authorization: Bearer <token>)
├── models/
│   ├── User.js            Utilisateur
│   ├── Task.js            Tâche
│   └── Comment.js         Commentaire
└── routes/
    ├── authRoutes.js      /api/auth
    ├── taskRoutes.js      /api/tasks
    └── commentRoutes.js   /api/comments
```

## Modèles de données

```
User 1 ──── N Task 1 ──── N Comment
  └──────────────────────── N Comment   (auteur)
```

| Modèle | Champs principaux |
|---|---|
| **User** | `name`, `email` (unique), `password` (hash bcrypt), `role` : `Admin` \| `Employe` (défaut) |
| **Task** | `title`, `description`, `status` : `A faire` \| `En cours` \| `Terminee`, `priority` : `Basse` \| `Moyenne` \| `Haute`, `dueDate`, `author` → `User` |
| **Comment** | `text`, `task` → `Task`, `author` → `User` |

Tous les modèles ont `createdAt` / `updatedAt` (`timestamps`). Les auteurs sont affichés via `.populate()`. La suppression d'une tâche supprime en cascade ses commentaires.

## Authentification

1. `POST /api/auth/register` ou `/api/auth/login` renvoie `{ user, token }`.
2. Le token JWT est valable **24 h** et contient `id`, `name`, `email`, `role`.
3. Pour les routes protégées 🔒, envoyer le header :

   ```
   Authorization: Bearer <token>
   ```

4. Autorisations : l'**auteur** d'une tâche ou d'un commentaire, ou un **Admin**, peut le modifier / supprimer.

## Endpoints de l'API

Toutes les routes sont préfixées par `/api`. `GET /` renvoie un message de santé de l'API.

### Authentification

| Méthode | Route | Accès | Description | Codes |
|---|---|---|---|---|
| POST | `/auth/register` | Public | Inscription (`name`, `email`, `password` ≥ 6 caractères) | 201 · 400 · 409 |
| POST | `/auth/login` | Public | Connexion (`email`, `password`) | 200 · 400 · 401 |
| GET | `/auth/me` | 🔒 JWT | Profil de l'utilisateur connecté | 200 · 401 · 404 |

### Tâches

| Méthode | Route | Accès | Description | Codes |
|---|---|---|---|---|
| GET | `/tasks` | Public | Liste des tâches (plus récentes d'abord) | 200 |
| GET | `/tasks/:id` | Public | Détail d'une tâche | 200 · 404 |
| POST | `/tasks` | 🔒 JWT | Créer une tâche (`title` requis) | 201 · 400 · 401 |
| PUT | `/tasks/:id` | 🔒 Auteur ou Admin | Modifier une tâche | 200 · 400 · 403 · 404 |
| DELETE | `/tasks/:id` | 🔒 Auteur ou Admin | Supprimer une tâche et ses commentaires | 200 · 403 · 404 |

### Commentaires

| Méthode | Route | Accès | Description | Codes |
|---|---|---|---|---|
| GET | `/comments/task/:taskId` | Public | Commentaires d'une tâche (ordre chronologique) | 200 · 404 |
| POST | `/comments` | 🔒 JWT | Ajouter un commentaire (`text`, `taskId`) | 201 · 400 · 404 |
| DELETE | `/comments/:id` | 🔒 Auteur ou Admin | Supprimer un commentaire | 200 · 403 · 404 |

Toute route inconnue renvoie `404` au format JSON : `{ "message": "Route introuvable : ..." }`.

## Exemples de requêtes

**Connexion**

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@pme.tn","password":"123456"}'
```

**Créer une tâche**

```bash
curl -X POST http://localhost:5000/api/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"title":"Préparer le bilan","priority":"Haute","status":"A faire","dueDate":"2026-12-01"}'
```

**Ajouter un commentaire**

```bash
curl -X POST http://localhost:5000/api/comments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"text":"À finaliser avant vendredi.","taskId":"<id_de_la_tâche>"}'
```

## Déploiement

Exemple avec **MongoDB Atlas** + **Render** :

1. **Atlas** : créer un cluster, un utilisateur de base de données, autoriser l'accès réseau, puis copier l'URI `mongodb+srv://...`.
2. **Render** : *New → Web Service*, dossier racine `backend`, Build `npm install`, Start `npm start`.
3. Définir les variables : `MONGODB_URI`, `JWT_SECRET` (longue phrase secrète), `NODE_ENV=production`, `CLIENT_URL` (URL du front déployé).
