const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Query = require('./models/Query');
dotenv.config();

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const q = await Query.find({});
  console.log(q.map(cur => ({ id: cur._id, queryId: cur.queryId, subject: cur.subject })));
  process.exit(0);
}
check();
