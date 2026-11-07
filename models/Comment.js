const mongoose = require('mongoose');

// ==============================================================================
// Entité 3 (Entité Liée) : Commentaire (texte, tâche liée, auteur, date)
// Relation One-to-Many : 1 Tâche -> N Commentaires (champ "task" avec ref: 'Task')
// ==============================================================================
const commentSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: [true, 'Le texte du commentaire est obligatoire.'],
      trim: true
    },
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: true
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  { timestamps: true } // createdAt = date du commentaire
);

module.exports = mongoose.model('Comment', commentSchema);
