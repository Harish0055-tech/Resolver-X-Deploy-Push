/**
 * SLA Breach Checker - runs on an interval and notifies admin
 * when queries exceed their priority SLA limits.
 *
 * SLA limits:
 *   critical → 30 minutes
 *   high     → 1 hour   (60 mins)
 *   medium   → 5 hours  (300 mins)
 *   low      → 10 hours (600 mins)
 */

const Query = require('./models/Query');
const User = require('./models/User');
const Notification = require('./models/Notification');

const SLA_MINUTES = {
  critical: 30,
  high: 60,
  medium: 300,
  low: 600,
};

// Track which query IDs we already notified to avoid spam
const _notifiedSet = new Set();

async function runSlaCheck(io) {
  try {
    const now = Date.now();

    // Only check open/in-progress queries
    const activeQueries = await Query.find({
      status: { $in: ['open', 'in-progress'] },
    });

    // Find the super admin to receive breach notifications
    const superAdmin = await User.findOne({ category: 'SUPER_ADMIN' });
    if (!superAdmin) return;

    for (const query of activeQueries) {
      const priority = query.priority;
      const slaMins = SLA_MINUTES[priority];
      if (!slaMins) continue;

      const createdAt = new Date(query.createdAt).getTime();
      const elapsedMins = (now - createdAt) / (1000 * 60);

      if (elapsedMins < slaMins) continue; // Not breached yet

      // Build a unique key: queryId + priority to avoid duplicate notifications
      const notifKey = `sla_breach_${query._id}_${priority}`;
      if (_notifiedSet.has(notifKey)) continue;

      // Also check if we already have a stored SLA breach notification for this query
      const alreadyNotified = await Notification.findOne({
        type: 'sla_breach',
        message: { $regex: query.queryId || String(query._id) },
      });
      if (alreadyNotified) {
        _notifiedSet.add(notifKey); // Cache it to avoid future DB hits
        continue;
      }

      const message = `(${query.queryId || query._id}) Time Exceeded`;

      const notif = await Notification.create({
        userId: superAdmin._id,
        username: superAdmin.username,
        message,
        type: 'sla_breach',
      });

      if (io) io.to(superAdmin.username).emit('notification', notif);

      _notifiedSet.add(notifKey);
      console.log(`[SLA] Breach alert sent for ${query.queryId || query._id} (${priority})`);
    }
  } catch (err) {
    console.error('[SLA Checker Error]', err.message);
  }
}

/**
 * Starts the SLA checker interval.
 * Runs every 60 seconds.
 * @param {SocketIO.Server} io
 */
function startSlaChecker(io) {
  console.log('[SLA] SLA breach checker started (interval: 60s)');
  // Run immediately on startup, then every minute
  runSlaCheck(io);
  setInterval(() => runSlaCheck(io), 60 * 1000);
}

module.exports = { startSlaChecker };
