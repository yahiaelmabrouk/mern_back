const express = require('express');
const mongoose = require('mongoose');
const Comment = require('../models/Comment');
const Task = require('../models/Task');
const protect = require('../middleware/protect');

const router = express.Router();

// ==============================================================================
// GET /api/comments/task/:taskId : PUBLIQUE -- Commentaires d'une tâche
// .populate('author') pour afficher le nom de l'auteur de chaque commentaire
// ==============================================================================
router.get('/task/:taskId', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.taskId)) {
      return res.status(404).json({ message: 'Tâche introuvable.' });
    }
    const comments = await Comment.find({ task: req.params.taskId })
      .populate('author', 'name')
      .sort({ createdAt: 1 });
    res.status(200).json(comments);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur lors du chargement des commentaires.', error: err.message });
  }
});

// ==============================================================================
// POST /api/comments : PROTÉGÉE PAR JWT -- Ajouter un commentaire à une tâche
// ==============================================================================
router.post('/', protect, async (req, res) => {
  try {
    const { text, taskId } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Le texte du commentaire est obligatoire.' });
    }
    if (!mongoose.isValidObjectId(taskId) || !(await Task.exists({ _id: taskId }))) {
      return res.status(404).json({ message: 'Tâche introuvable.' });
    }

    const newComment = await Comment.create({
      text: text.trim(),
      task: taskId,
      author: req.user.id
    });

    await newComment.populate('author', 'name');
    res.status(201).json(newComment);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur lors de l ajout du commentaire.', error: err.message });
  }
});

// ==============================================================================
// DELETE /api/comments/:id : PROTÉGÉE PAR JWT -- Supprimer son commentaire
// ==============================================================================
router.delete('/:id', protect, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: 'Commentaire introuvable.' });
    }
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ message: 'Commentaire introuvable.' });
    }
    if (comment.author.toString() !== req.user.id && req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Accès interdit (403) : seul l auteur peut supprimer ce commentaire.' });
    }

    await comment.deleteOne();
    res.status(200).json({ message: 'Commentaire supprimé.', id: comment._id });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur lors de la suppression.', error: err.message });
  }
});

module.exports = router;
