const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['status_change', 'comment', 'assignment'],
    required: true,
  },
  user: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  oldStatus: String,
  newStatus: String,
  timestamp: {
    type: Date,
    default: Date.now,
  }
});

const attachmentSchema = new mongoose.Schema({
  name: String,
  size: Number,
  type: String,
  url: String,
  uploadedAt: {
    type: Date,
    default: Date.now,
  }
});

const querySchema = new mongoose.Schema({
  queryId: {
    type: String,
    required: false,
    unique: true,
    sparse: true
  },
  subject: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  originalCategory: {
    // Stores the true category when redirected to General due to no resolver
    type: String,
    default: null,
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
  },
  status: {
    type: String,
    enum: ['open', 'in-progress', 'resolved', 'closed'],
    default: 'open',
  },
  description: {
    type: String,
    required: true,
  },
  submittedBy: {
    type: String,
    required: true,
  },
  assignedTo: {
    type: String,
  },
  assignedResolverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignmentHistory: [{
    resolverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    assignedAt: { type: Date, default: Date.now }
  }],
  activities: [activitySchema],
  attachments: [attachmentSchema],
}, { timestamps: true });

module.exports = mongoose.model('Query', querySchema);
