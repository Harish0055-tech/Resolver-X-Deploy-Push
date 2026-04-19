const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const queryRoutes = require('./routes/queries');
const notificationRoutes = require('./routes/notifications');
const User = require('./models/User');
const { startSlaChecker } = require('./slaChecker');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use((req, res, next) => {
  req.io = io;
  next();
});

io.on('connection', (socket) => {
  socket.on('join', (userId) => {
    socket.join(userId.toString());
  });
});

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'admin@admin.com').toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '123';

async function bootstrapAdmin() {
  const existing = await User.findOne({ username: ADMIN_EMAIL });
  if (existing) return;

  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(ADMIN_PASSWORD, salt);
  await User.create({
    fullName: 'System Admin',
    username: ADMIN_EMAIL,
    password: hash,
    role: 'admin',
    category: 'SUPER_ADMIN',
  });
  console.log(`Default admin created: ${ADMIN_EMAIL}`);
}

// Database connection
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB Atlas');
    await bootstrapAdmin();
    startSlaChecker(io); // Start SLA breach background checker
  })
  .catch((err) => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/queries', queryRoutes);
app.use('/api/notifications', notificationRoutes);

// Basic route
app.get('/', (req, res) => {
  res.send('ResolveX API is running');
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
