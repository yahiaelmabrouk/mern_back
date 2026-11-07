const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const protect = require('../middleware/protect');

const router = express.Router();

// Fabrique le Token JWT signé (valable 24h) à partir des infos publiques de l'utilisateur
const generateToken = (userInfo) =>
  jwt.sign(userInfo, process.env.JWT_SECRET, { expiresIn: '24h' });

const toUserInfo = (user) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  role: user.role
});

// ==============================================================================
// POST /api/auth/register : Inscription (mot de passe haché avec bcrypt)
// ==============================================================================
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Nom, email et mot de passe obligatoires.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 6 caractères.' });
    }

    const exists = await User.findOne({ email: email.trim().toLowerCase() });
    if (exists) {
      return res.status(409).json({ message: 'Cet email est déjà utilisé.' });
    }

    // Hachage du mot de passe : aucun mot de passe n'est stocké en clair
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword
    });

    const userInfo = toUserInfo(newUser);
    const token = generateToken(userInfo);

    res.status(201).json({ user: userInfo, token });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur lors de l inscription.', error: err.message });
  }
});

// ==============================================================================
// POST /api/auth/login : Connexion (comparaison bcrypt + génération du Token JWT)
// ==============================================================================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email et mot de passe obligatoires.' });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });

    // Même message dans les 2 cas pour ne pas révéler quels emails existent
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Identifiants incorrects.' });
    }

    const userInfo = toUserInfo(user);
    const token = generateToken(userInfo);

    res.status(200).json({ user: userInfo, token });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur lors de la connexion.', error: err.message });
  }
});

// ==============================================================================
// GET /api/auth/me : Profil de l'utilisateur connecté (protégé par JWT)
// ==============================================================================
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur introuvable.' });
    }
    res.status(200).json(toUserInfo(user));
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
});

module.exports = router;
