const express = require('express');
const http = require('http');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');

dotenv.config();

const connectDB = require('./config/db');
const { initSocket } = require('./config/socket');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const authRoutes = require('./routes/authRoutes');
const apiRoutes = require('./routes/apiRoutes');
const boardRoutes = require('./routes/boardRoutes');
const columnRoutes = require('./routes/columnRoutes');
const taskRoutes = require('./routes/taskRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const { startDueDateReminderJob } = require('./services/dueDateReminderService');

// Connect to MongoDB
connectDB();

const app = express();

// ----- Global Middleware -----

// Build the list of allowed origins from the CLIENT_URL env var.
// CLIENT_URL may be a single URL or a comma-separated list of URLs,
// which is useful when the frontend is deployed on Railway with a
// generated domain alongside a custom domain.
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. curl, Postman, server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin '${origin}' is not allowed`));
    },
    credentials: true,
  })
);

app.use(express.json());

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ----- API Routes -----

app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'WorkHive API is running' });
});

app.use('/api/auth', authRoutes);

// Convenience aliases: /api/login, /api/register, /api/me, /api/logout
// These mirror the /api/auth/* routes for frontend backward compatibility.
app.use('/api', apiRoutes);

// Phase 2: Boards (CRUD + member management)
app.use('/api/boards', boardRoutes);

// Phase 3: Columns (nested under boards)
// boardRoutes mounts /api/boards, and columnRoutes handles /:boardId/columns
// We mount column routes directly on boards so :boardId is available via mergeParams
app.use('/api/boards/:boardId/columns', columnRoutes);

// Phase 4/5/7/9: Tasks (nested under boards) — CRUD, move/reorder, comments, search & filters
app.use('/api/boards/:boardId/tasks', taskRoutes);

// Phase 10: Notifications
app.use('/api/notifications', notificationRoutes);

// ----- Error Handling Middleware (must be last) -----
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Phase 12: wrap the Express app in an HTTP server so Socket.IO can attach
// to the same port.
const httpServer = http.createServer(app);
initSocket(httpServer);

httpServer.listen(PORT, () => {
  console.log(
    `WorkHive server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`
  );
  console.log('Socket.IO real-time server attached');
  startDueDateReminderJob();
});

module.exports = app;
