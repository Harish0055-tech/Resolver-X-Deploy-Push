/**
 * Shared assignment helper for Resolve X
 * 
 * Resolves which admin should handle a query, falling back to General if needed.
 * Also handles reclaiming General-held queries when a specific category resolver appears.
 */

const User = require('../models/User');
const Query = require('../models/Query');
const Notification = require('../models/Notification');

const SUPER_ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'admin@admin.com').toLowerCase();

/**
 * Find the best resolver for a given category.
 * Falls back to a General resolver if no specific one is found.
 * Excludes a specific resolver ID (e.g., the one being reassigned).
 *
 * @param {string} category - The query category (e.g., 'HR', 'IT Support')
 * @param {ObjectId|null} excludeResolverId - Resolver to exclude from results
 * @returns {{ resolver: User|null, usedFallback: boolean }}
 */
async function findBestResolver(category, excludeResolverId = null) {
  const baseFilter = {
    role: 'admin',
    username: { $ne: SUPER_ADMIN_EMAIL },
  };
  if (excludeResolverId) {
    baseFilter._id = { $ne: excludeResolverId };
  }

  // Try to find a resolver in the exact category first
  const categoryResolvers = await User.find({ ...baseFilter, category });
  if (categoryResolvers.length > 0) {
    // Pick least-loaded resolver (by open query count)
    const counts = await Promise.all(
      categoryResolvers.map(async (r) => ({
        resolver: r,
        count: await Query.countDocuments({
          status: { $in: ['open', 'in-progress'] },
          assignedResolverId: r._id,
        }),
      }))
    );
    counts.sort((a, b) => a.count - b.count);
    return { resolver: counts[0].resolver, usedFallback: false };
  }

  // No resolver for this category → fall back to General
  const generalResolvers = await User.find({ ...baseFilter, category: 'General' });
  if (generalResolvers.length > 0) {
    const counts = await Promise.all(
      generalResolvers.map(async (r) => ({
        resolver: r,
        count: await Query.countDocuments({
          status: { $in: ['open', 'in-progress'] },
          assignedResolverId: r._id,
        }),
      }))
    );
    counts.sort((a, b) => a.count - b.count);
    return { resolver: counts[0].resolver, usedFallback: true };
  }

  return { resolver: null, usedFallback: false };
}

/**
 * When a resolver joins a new category, reclaim any open queries that are:
 * - Currently held by a General resolver (as fallback)
 * - originalCategory === newCategory
 *
 * @param {User} newCategoryResolver - The resolver who now handles the category
 * @param {string} category - The category they now handle
 * @param {SocketIO.Server} io - Socket server for real-time updates
 */
async function reclaimFromGeneral(newCategoryResolver, category, io) {
  // Find open queries in General whose true category matches
  const queriesHeldByGeneral = await Query.find({
    status: { $in: ['open', 'in-progress'] },
    originalCategory: category,
  });

  for (const query of queriesHeldByGeneral) {
    const oldResolverName = query.assignedTo;
    const newResolverName = newCategoryResolver.fullName || newCategoryResolver.username;

    query.assignedTo = newResolverName;
    query.assignedResolverId = newCategoryResolver._id;
    query.originalCategory = null; // Cleared — now correctly assigned
    query.assignmentHistory.push({
      resolverId: newCategoryResolver._id,
      assignedAt: new Date(),
    });
    query.activities.push({
      type: 'assignment',
      user: 'System',
      content: `Query reclaimed from General (${oldResolverName}) and assigned to ${newResolverName} — a resolver is now available in ${category}.`,
    });

    await query.save();

    // Notify new resolver
    const notifNew = await Notification.create({
      userId: newCategoryResolver._id,
      username: newCategoryResolver.username,
      message: `Query (${query.queryId || query._id}) has been moved to you from General because you now handle ${category}.`,
      type: 'reassignment',
    });
    if (io) io.to(newCategoryResolver.username).emit('notification', notifNew);
    if (io) io.to(newCategoryResolver.username).emit('queryUpdated', query);

    // Notify submitter
    const userObj = await User.findOne({ username: query.submittedBy });
    if (userObj) {
      const notifUser = await Notification.create({
        userId: userObj._id,
        username: userObj.username,
        message: `Your query (${query.queryId || query._id}) has been reassigned to a ${category} specialist.`,
        type: 'query_update',
      });
      if (io) io.to(userObj.username).emit('notification', notifUser);
      if (io) io.to(userObj.username).emit('queryUpdated', query);
    }
  }

  return queriesHeldByGeneral.length;
}

module.exports = { findBestResolver, reclaimFromGeneral };
