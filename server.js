const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const User = require('./models/User');
const Task = require('./models/Task');
const Comment = require('./models/Comment');
const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');
const commentRoutes = require('./routes/commentRoutes');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/taskflow';

// Sans secret JWT, le serveur ne doit pas démarrer en production
if (!process.env.JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ JWT_SECRET manquant dans les variables d environnement.');
    process.exit(1);
  }
  process.env.JWT_SECRET = 'secret_jwt_dev_local_uniquement';
}

// ==============================================================================
// 1. Middlewares Globaux : CORS & JSON
// ==============================================================================
// En production, CLIENT_URL = l'adresse Vercel (ex : https://mon-taskflow.vercel.app)
// En local (variable absente), toutes les origines sont acceptées.
app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(express.json());

// ==============================================================================
// 2. Routes de l'API
// ==============================================================================
app.get('/', (req, res) => {
  res.status(200).json({ message: 'API TaskFlow PME en ligne 🚀' });
});

app.use('/api/auth', authRoutes);         // register, login, me
app.use('/api/tasks', taskRoutes);        // GET public | POST, PUT, DELETE protégés
app.use('/api/comments', commentRoutes);  // GET public | POST, DELETE protégés

// Route inconnue -> 404 JSON
app.use((req, res) => {
  res.status(404).json({ message: `Route introuvable : ${req.method} ${req.originalUrl}` });
});

// ==============================================================================
// 3. Données de démonstration (créées une seule fois si la base est vide)
// ==============================================================================
const DEMO_EMAIL = 'admin@pme.tn';
const DEMO_PASSWORD = '123456';

const seedDemoData = async () => {
  const exists = await User.findOne({ email: DEMO_EMAIL });
  if (exists) return;

  const admin = await User.create({
    name: 'Responsable PME',
    email: DEMO_EMAIL,
    password: await bcrypt.hash(DEMO_PASSWORD, 10),
    role: 'Admin'
  });

  const tasks = await Task.insertMany([
    {
      title: 'Préparer l inventaire du matériel informatique',
      description: 'Lister les PC, imprimantes et écrans du 1er étage.',
      priority: 'Haute',
      status: 'En cours',
      author: admin._id
    },
    {
      title: 'Planifier la réunion trimestrielle',
      description: 'Réserver la salle et envoyer l ordre du jour.',
      priority: 'Moyenne',
      status: 'A faire',
      author: admin._id
    },
    {
      title: 'Mettre à jour le catalogue produits',
      description: 'Ajouter les nouvelles références du fournisseur.',
      priority: 'Basse',
      status: 'Terminee',
      author: admin._id
    }
  ]);

  await Comment.create({
    text: 'Penser à vérifier aussi le stock de câbles réseau.',
    task: tasks[0]._id,
    author: admin._id
  });

  console.log('🌱 Données de démonstration créées.');
};

// ==============================================================================
// 4. Connexion MongoDB (Mongoose) puis démarrage du serveur
// ==============================================================================
mongoose
  .connect(MONGODB_URI)
  .then(async () => {
    console.log('✅ Connecté à MongoDB');
    await seedDemoData();

    app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`🚀 Serveur TaskFlow PME (MERN + JWT) en écoute sur :`);
      console.log(`👉 http://localhost:${PORT}`);
      console.log(`🔑 Compte Démo : ${DEMO_EMAIL} | Mot de passe : ${DEMO_PASSWORD}`);
      console.log(`====================================================`);
    });
  })
  .catch((err) => {
    console.error('❌ Erreur de connexion MongoDB :', err.message);
    process.exit(1);
  });
