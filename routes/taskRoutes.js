const express = require('express');
const mongoose = require('mongoose');
const Task = require('../models/Task');
const Comment = require('../models/Comment');
const protect = require('../middleware/protect');

const router = express.Router();

// Seul l'auteur de la tâche (ou un Admin) peut la modifier / supprimer
const canManage = (task, user) =>
  task.author.toString() === user.id || user.role === 'Admin';

// ==============================================================================
// GET /api/tasks : PUBLIQUE -- Tout le monde peut consulter les tâches
// .populate('author') remplace l'ObjectId par le nom et l'email de l'auteur
// ==============================================================================
router.get('/', async (req, res) => {
  try {
    const tasks = await Task.find()
      .populate('author', 'name email')
      .sort({ createdAt: -1 });
    res.status(200).json(tasks);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur lors du chargement des tâches.', error: err.message });
  }
});

// ==============================================================================
// GET /api/tasks/:id : PUBLIQUE -- Détail d'une tâche
// ==============================================================================
router.get('/:id', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: 'Tâche introuvable.' });
    }
    const task = await Task.findById(req.params.id).populate('author', 'name email');
    if (!task) {
      return res.status(404).json({ message: 'Tâche introuvable.' });
    }
    res.status(200).json(task);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
});

// ==============================================================================
// POST /api/tasks : PROTÉGÉE PAR JWT -- Seul un utilisateur connecté peut créer
// ==============================================================================
router.post('/', protect, async (req, res) => {
  try {
    const { title, description, priority, status, dueDate } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Le titre de la tâche est obligatoire.' });
    }

    const newTask = await Task.create({
      title: title.trim(),
      description,
      priority,
      status,
      dueDate: dueDate || undefined,
      author: req.user.id // L'auteur vient directement du Token JWT !
    });

    // On renvoie la tâche avec le nom de l'auteur (populate)
    await newTask.populate('author', 'name email');
    res.status(201).json(newTask);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: 'Erreur serveur lors de la création.', error: err.message });
  }
});

// ==============================================================================
// PUT /api/tasks/:id : PROTÉGÉE PAR JWT -- Modifier une tâche (ex : son statut)
// ==============================================================================
router.put('/:id', protect, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: 'Tâche introuvable.' });
    }
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Tâche introuvable.' });
    }
    if (!canManage(task, req.user)) {
      return res.status(403).json({ message: 'Accès interdit (403) : seul l auteur de la tâche peut la modifier.' });
    }

    const { title, description, priority, status, dueDate } = req.body;
    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (priority !== undefined) task.priority = priority;
    if (status !== undefined) task.status = status;
    if (dueDate !== undefined) task.dueDate = dueDate || undefined;

    await task.save();
    await task.populate('author', 'name email');
    res.status(200).json(task);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: 'Erreur serveur lors de la modification.', error: err.message });
  }
});

// ==============================================================================
// DELETE /api/tasks/:id : PROTÉGÉE PAR JWT -- Supprimer une tâche et ses commentaires
// ==============================================================================
router.delete('/:id', protect, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: 'Tâche introuvable.' });
    }
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Tâche introuvable.' });
    }
    if (!canManage(task, req.user)) {
      return res.status(403).json({ message: 'Accès interdit (403) : seul l auteur de la tâche peut la supprimer.' });
    }

    await Comment.deleteMany({ task: task._id }); // Suppression en cascade (1 -> N)
    await task.deleteOne();

    res.status(200).json({ message: 'Tâche supprimée.', id: task._id });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur lors de la suppression.', error: err.message });
  }
});

module.exports = router;
