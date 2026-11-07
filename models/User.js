const mongoose = require('mongoose');

// ==============================================================================
// Entité 1 : Utilisateur (nom, email, mot de passe haché avec bcrypt)
// ==============================================================================
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Le nom est obligatoire.'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'L email est obligatoire.'],
      unique: true,
      lowercase: true,
      trim: true
    },
    // Jamais en clair : on stocke uniquement le hash bcrypt
    password: {
      type: String,
      required: [true, 'Le mot de passe est obligatoire.'],
      minlength: 6
    },
    role: {
      type: String,
      enum: ['Admin', 'Employe'],
      default: 'Employe'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
