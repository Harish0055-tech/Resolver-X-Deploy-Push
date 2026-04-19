const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Query = require('./models/Query');

dotenv.config();

async function migrateQueryIds() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const queries = await Query.find({ queryId: { $exists: false } }).sort({ createdAt: 1 });
    console.log(`Found ${queries.length} queries without queryId.`);

    if (queries.length === 0) {
      console.log('No migration needed.');
      process.exit(0);
    }

    // Get the latest queryId to start from
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

    for (const query of queries) {
      query.queryId = `QR-${nextIdNumber++}`;
      await query.save();
      console.log(`Updated query ${query._id} -> ${query.queryId}`);
    }

    console.log('Migration completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrateQueryIds();
