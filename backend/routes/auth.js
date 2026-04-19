const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Query = require('../models/Query');
const Notification = require('../models/Notification');
const authMiddleware = require('../middleware/auth');
const { findBestResolver, reclaimFromGeneral } = require('../utils/assignmentHelper');
const router = express.Router();
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'admin@admin.com').toLowerCase();
const SUPER_ADMIN_CATEGORY = 'SUPER_ADMIN';

function normalizeUsername(input) {
  return String(input || '').trim().toLowerCase();
}

function isSuperAdmin(user) {
  return normalizeUsername(user?.username) === ADMIN_EMAIL || user?.category === SUPER_ADMIN_CATEGORY;
}

// Register a new user
router.post('/register', async (req, res) => {
  try {
    const { fullName, password } = req.body;
    const username = normalizeUsername(req.body.username || req.body.email);

    if (!fullName || !username || !password) {
      return res.status(400).json({ message: 'fullName, email and password are required' });
    }

    let user = await User.findOne({ username });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({
      fullName,
      username,
      password: hashedPassword,
      role: 'user',
      category: null,
    });

    await user.save();

    const payload = {
      user: {
        id: user.id,
        fullName: user.fullName,
        role: user.role,
        username: user.username,
        category: user.category
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '5h' },
      (err, token) => {
        if (err) throw err;
        res.json({ token, user: payload.user });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const username = normalizeUsername(req.body.username || req.body.email);
    const { password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'username and password are required' });
    }

    let user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: 'Invalid Credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid Credentials' });
    }

    const payload = {
      user: {
        id: user.id,
        fullName: user.fullName,
        role: user.role,
        username: user.username,
        category: user.category,
        isSuperAdmin: isSuperAdmin(user),
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '5h' },
      (err, token) => {
        if (err) throw err;
        res.json({ token, user: payload.user });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get current user details using token (useful for persistent login)
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json({ ...user.toObject(), isSuperAdmin: isSuperAdmin(user) });
    } catch(err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Super admin: list users
router.get('/admin/users', authMiddleware, async (req, res) => {
  try {
    if (!isSuperAdmin(req.user)) {
      return res.status(403).json({ message: 'Only super admin can manage users' });
    }
    const users = await User.find({ role: 'user' }).select('-password').sort({ createdAt: -1 });
    return res.json(users);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send('Server Error');
  }
});

// Super admin: delete user
router.delete('/admin/users/:id', authMiddleware, async (req, res) => {
  try {
    if (!isSuperAdmin(req.user)) {
      return res.status(403).json({ message: 'Only super admin can manage users' });
    }
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ message: 'User not found' });
    if (target.role !== 'user') return res.status(400).json({ message: 'Only user accounts can be deleted here' });
    await User.findByIdAndDelete(req.params.id);
    return res.json({ message: 'User deleted' });
  } catch (err) {
    console.error(err.message);
    return res.status(500).send('Server Error');
  }
});

// Super admin: list resolvers
router.get('/admin/resolvers', authMiddleware, async (req, res) => {
  try {
    if (!isSuperAdmin(req.user)) {
      return res.status(403).json({ message: 'Only super admin can manage resolvers' });
    }
    const resolvers = await User.find({
      role: 'admin',
      username: { $ne: ADMIN_EMAIL },
    }).select('-password').sort({ createdAt: -1 });
    return res.json(resolvers);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send('Server Error');
  }
});

// Super admin: create resolver
router.post('/admin/resolvers', authMiddleware, async (req, res) => {
  try {
    if (!isSuperAdmin(req.user)) {
      return res.status(403).json({ message: 'Only super admin can manage resolvers' });
    }
    const username = normalizeUsername(req.body.email || req.body.username);
    const password = String(req.body.password || '');
    const category = String(req.body.category || req.body.role || '').trim();
    const fullName = String(req.body.fullName || username.split('@')[0] || 'Resolver').trim();

    if (!username || !password || !category) {
      return res.status(400).json({ message: 'email, password and category are required' });
    }
    const exists = await User.findOne({ username });
    if (exists) return res.status(400).json({ message: 'Resolver already exists' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const resolver = await User.create({
      fullName,
      username,
      password: hashedPassword,
      role: 'admin',
      category,
    });

    // When a new resolver is created for a specific (non-General) category,
    // reclaim any queries currently held by General for that category.
    if (category !== 'General' && category !== 'SUPER_ADMIN') {
      await reclaimFromGeneral(resolver, category, req.io);
    }

    return res.status(201).json({
      message: 'Resolver created',
      resolver: {
        id: resolver.id,
        fullName: resolver.fullName,
        username: resolver.username,
        role: resolver.role,
        category: resolver.category,
        createdAt: resolver.createdAt,
      },
    });
  } catch (err) {
    console.error(err.message);
    return res.status(500).send('Server Error');
  }
});

// Super admin: update resolver category
router.patch('/admin/resolvers/:id/category', authMiddleware, async (req, res) => {
  try {
    if (!isSuperAdmin(req.user)) {
      return res.status(403).json({ message: 'Only super admin can manage resolvers' });
    }
    const newCategory = String(req.body.category || req.body.role || '').trim();
    if (!newCategory) return res.status(400).json({ message: 'category is required' });

    const resolver = await User.findById(req.params.id);
    if (!resolver) return res.status(404).json({ message: 'Resolver not found' });
    if (resolver.role !== 'admin' || normalizeUsername(resolver.username) === ADMIN_EMAIL) {
      return res.status(400).json({ message: 'Target is not a resolver account' });
    }

    const oldCategory = resolver.category;
    resolver.category = newCategory;
    await resolver.save();

    // Reassignment logic if the category changed
    if (oldCategory !== newCategory) {
      // Find open/pending queries assigned to this resolver that do NOT match the new category
      const queriesToReassign = await Query.find({
        status: { $in: ['open', 'in-progress'] },
        $or: [
          { assignedTo: resolver.fullName || resolver.username },
          { assignedResolverId: resolver._id }
        ],
        category: { $ne: newCategory }
      });

      if (queriesToReassign.length > 0) {
        const previousResolverName = resolver.fullName || resolver.username;

        for (const query of queriesToReassign) {
          // Find the best resolver for the query's category, excluding the old resolver
          // Falls back to General if no specific category resolver exists
          const { resolver: newResolver, usedFallback } = await findBestResolver(query.category, resolver._id);

          if (newResolver) {
            const newResolverName = newResolver.fullName || newResolver.username;
            query.assignedTo = newResolverName;
            query.assignedResolverId = newResolver._id;
            // If assigned to General as fallback, record the true category
            query.originalCategory = usedFallback ? query.category : null;
            query.assignmentHistory.push({
              resolverId: newResolver._id,
              assignedAt: new Date(),
            });
            query.activities.push({
              type: 'assignment',
              user: 'System',
              content: usedFallback
                ? `Query reassigned from ${previousResolverName} to General resolver ${newResolverName} (no ${query.category} resolver available).`
                : `Query reassigned from ${previousResolverName} to ${newResolverName} due to role change.`,
            });

            // Notify new resolver
            const notifNew = await Notification.create({
              userId: newResolver._id,
              username: newResolver.username,
              message: usedFallback
                ? `Query (${query.queryId || query._id}) temporarily assigned to you (General) — no ${query.category} resolver available.`
                : `Query (${query.queryId || query._id}) has been assigned to you due to resolver category change.`,
              type: 'reassignment',
            });
            if (req.io) req.io.to(newResolver.username).emit('notification', notifNew);
            if (req.io) req.io.to(newResolver.username).emit('queryUpdated', query);

          } else {
            // Absolutely no resolver anywhere — keep track but don't leave unassigned silently
            query.assignedTo = null;
            query.assignedResolverId = null;
            query.originalCategory = query.category; // Remember the intended category
            query.activities.push({
              type: 'assignment',
              user: 'System',
              content: `Query left unassigned — no resolver found in ${query.category} or General.`,
            });
          }

          await query.save();

          // Notify submitter user
          const userObj = await User.findOne({ username: query.submittedBy });
          if (userObj) {
            const notifUser = await Notification.create({
              userId: userObj._id,
              username: userObj.username,
              message: `Your query (${query.queryId || query._id}) has been reassigned to a new resolver.`,
              type: 'query_update',
            });
            if (req.io) req.io.to(userObj.username).emit('notification', notifUser);
            if (req.io) req.io.to(userObj.username).emit('queryUpdated', query);
          }
        }

        // Notify the old resolver
        const notifOld = await Notification.create({
          userId: resolver._id,
          username: resolver.username,
          message: `Your role/category has been updated to ${newCategory}. All your non-${newCategory} queries have been reassigned.`,
          type: 'role_update',
        });
        if (req.io) req.io.to(resolver.username).emit('notification', notifOld);
      }

      // If the resolver is now assigned to a specific category (not General),
      // reclaim any General-held queries for that new category.
      if (newCategory !== 'General' && newCategory !== 'SUPER_ADMIN') {
        await reclaimFromGeneral(resolver, newCategory, req.io);
      }
    }

    return res.json({
      message: 'Resolver category updated',
      resolver: {
        id: resolver.id,
        fullName: resolver.fullName,
        username: resolver.username,
        role: resolver.role,
        category: resolver.category,
      },
    });
  } catch (err) {
    console.error(err.message);
    return res.status(500).send('Server Error');
  }
});

// Super admin: delete resolver
router.delete('/admin/resolvers/:id', authMiddleware, async (req, res) => {
  try {
    if (!isSuperAdmin(req.user)) {
      return res.status(403).json({ message: 'Only super admin can manage resolvers' });
    }

    const resolver = await User.findById(req.params.id);
    if (!resolver) return res.status(404).json({ message: 'Resolver not found' });
    if (resolver.role !== 'admin' || normalizeUsername(resolver.username) === ADMIN_EMAIL) {
      return res.status(400).json({ message: 'Target is not a resolver account' });
    }

    await User.findByIdAndDelete(req.params.id);
    return res.json({ message: 'Resolver deleted' });
  } catch (err) {
    console.error(err.message);
    return res.status(500).send('Server Error');
  }
});

module.exports = router;
