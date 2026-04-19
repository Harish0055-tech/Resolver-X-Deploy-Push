const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Query = require('./models/Query');
const User = require('./models/User');
dotenv.config();

async function resetDB() {
  await mongoose.connect(process.env.MONGODB_URI);
  await Query.deleteMany({});
  await User.deleteMany({});
  console.log('Database wiped for testing new fullName schema.');
  process.exit(0);
}
resetDB();
