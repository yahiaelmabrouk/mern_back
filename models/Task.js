const mongoose = require('mongoose');

// ==============================================================================
// Entité 2 (Métier Principal) : Tâche (titre, description, statut, priorité, auteur)
// Relation One-to-Many : 1 Utilisateur -> N Tâches (champ "author" avec ref: 'User')
// ==============================================================================
const STATUSES = ['A faire', 'En cours', 'Terminee'];
const PRIORITIES = ['Basse', 'Moyenne', 'Haute'];

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Le titre de la tache est obligatoire.'],
      trim: true
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    status: {
      type: String,
      enum: STATUSES,
      default: 'A faire'
    },
    priority: {
      type: String,
      enum: PRIORITIES,
      default: 'Moyenne'
    },
    dueDate: {
      type: Date
    },
    // Référence vers l'utilisateur qui a créé la tâche (affiché avec .populate())
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Task', taskSchema);
module.exports.STATUSES = STATUSES;
module.exports.PRIORITIES = PRIORITIES;
