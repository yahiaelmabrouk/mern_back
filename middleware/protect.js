const jwt = require('jsonwebtoken');

// ==============================================================================
// Middleware Sentinelle JWT (protect)
// Contrôle le header "Authorization: Bearer <token>" avant les actions protégées
// ==============================================================================
const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // 1. Vérifier la présence du badge "Bearer <token>"
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      message: 'Accès refusé (401) : Vous devez être connecté (Token JWT manquant).'
    });
  }

  try {
    // 2. Vérifier la signature et la date d'expiration du token
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, name, email, role }
    next();
  } catch (err) {
    return res.status(401).json({
      message: 'Accès refusé (401) : Token JWT invalide ou expiré.'
    });
  }
};

module.exports = protect;
