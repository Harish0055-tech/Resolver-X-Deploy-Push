const express = require('express');
const Query = require('../models/Query');
const User = require('../models/User');
const Notification = require('../models/Notification');
const authMiddleware = require('../middleware/auth');
const { findBestResolver } = require('../utils/assignmentHelper');

const router = express.Router();

// Get all queries (Admins get all theirs, Users get theirs)
router.get('/', authMiddleware, async (req, res) => {
  try {
    let queries;
    if (req.user.role === 'admin') {
      if (req.user.isSuperAdmin || !req.user.category) {
        // Super admin sees everything
        queries = await Query.find().sort({ createdAt: -1 });
      } else if (req.user.category === 'General') {
        // General resolvers see queries assigned directly to them (may include fallback tickets)
        queries = await Query.find({
          $or: [
            { assignedResolverId: req.user.id },
            { assignedTo: req.user.fullName || req.user.username }
          ]
        }).sort({ createdAt: -1 });
      } else {
        // Category resolver sees queries in their own category
        queries = await Query.find({ category: req.user.category }).sort({ createdAt: -1 });
      }
    } else {
      queries = await Query.find({ submittedBy: req.user.username }).sort({ createdAt: -1 });
    }
    res.json(queries);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Get specific query
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const query = await Query.findOne({ queryId: req.params.id }) || await Query.findById(req.params.id).catch(() => null);
    if (!query) return res.status(404).json({ message: 'Query not found' });
    
    if (req.user.role !== 'admin' && query.submittedBy !== req.user.username) {
        return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(query);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Create a query
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { subject, category, priority, description, attachments } = req.body;

    // Generate custom QR-XXXX format
    const lastQuery = await Query.findOne({ queryId: { $exists: true } }).sort({ createdAt: -1 });
    let nextIdNumber = 1001;
    if (lastQuery && lastQuery.queryId && lastQuery.queryId.startsWith('QR-')) {
      const lastIdParts = lastQuery.queryId.split('-');
      if (lastIdParts.length === 2) {
        const lastNum = parseInt(lastIdParts[1], 10);
        if (!isNaN(lastNum)) {
          nextIdNumber = lastNum + 1;
        }
      }
    }
    const queryId = `QR-${nextIdNumber}`;

    // Find the best resolver for this category (falls back to General if needed)
    const { resolver: assignedResolver, usedFallback } = await findBestResolver(category);
    const assignedTo = assignedResolver ? (assignedResolver.fullName || assignedResolver.username) : null;
    const assignedResolverId = assignedResolver ? assignedResolver._id : null;

    const newQuery = new Query({
      queryId,
      subject,
      category,
      // If assigned to General as fallback, store the real category in originalCategory
      originalCategory: (assignedResolver && usedFallback) ? category : null,
      priority,
      description,
      submittedBy: req.user.username,
      assignedTo,
      assignedResolverId,
      assignmentHistory: assignedResolverId ? [{ resolverId: assignedResolverId, assignedAt: new Date() }] : [],
      attachments: attachments || [],
      status: 'open',
      activities: [{
        type: 'status_change',
        user: 'System',
        content: assignedTo
          ? (usedFallback
              ? `Ticket created. No ${category} resolver found — assigned to General resolver ${assignedTo}.`
              : `Ticket created and assigned to ${assignedTo}.`)
          : 'Ticket created — no resolver available.',
        newStatus: 'open'
      }]
    });

    const query = await newQuery.save();

    // Instantly notify the assigned resolver
    if (assignedResolverId) {
      const notif = await Notification.create({
        userId: assignedResolverId,
        username: assignedResolver.username,
        message: `Q.id: ${queryId.replace('QR-', '')} - ${priority.charAt(0).toUpperCase() + priority.slice(1)}`,
        type: 'new_query',
      });
      if (req.io) req.io.to(assignedResolver.username).emit('notification', notif);
    }

    res.json(query);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Update a query (change status, add activity)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { status, assignedTo, category, newActivity } = req.body;
    let query = await Query.findOne({ queryId: req.params.id }) || await Query.findById(req.params.id).catch(() => null);

    if (!query) return res.status(404).json({ message: 'Query not found' });

    // Admins can update any, users can only add comments maybe, but let's say admins only can update status.
    if (req.user.role !== 'admin' && status && status !== query.status) {
        return res.status(403).json({ message: 'Only admins can change status' });
    }

    if (status) query.status = status;
    if (assignedTo !== undefined) query.assignedTo = assignedTo;
    if (category) query.category = category;
    
    if (newActivity) {
      query.activities.push({
        ...newActivity,
        user: req.user.username,
        timestamp: new Date()
      });
    }

    await query.save();
    res.json(query);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Delete a query
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const query = await Query.findOne({ queryId: req.params.id }) || await Query.findById(req.params.id).catch(() => null);
    if (!query) return res.status(404).json({ message: 'Query not found' });

    // Only admins or the owner can delete
    if (req.user.role !== 'admin' && query.submittedBy !== req.user.username) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await Query.findOneAndDelete({ _id: query._id });
    res.json({ message: 'Query removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
