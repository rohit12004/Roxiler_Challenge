const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const { validate } = require('./middlewares/validation.middleware');
const { protect, restrictTo } = require('./middlewares/auth.middleware');
const { registerSchema, loginSchema, adminCreateUserSchema, updatePasswordSchema, submitRatingSchema, adminResetPasswordSchema } = require('./schemas/validation');
const userController = require('./controllers/user.controller');
const adminController = require('./controllers/admin.controller');
const storeController = require('./controllers/store.controller');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Parsers
app.use(express.json());
app.use(cookieParser());

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Authentication Endpoints
app.post('/api/auth/register', validate(registerSchema), userController.register);
app.post('/api/auth/login', validate(loginSchema), userController.login);
app.post('/api/auth/logout', userController.logout);
app.post('/api/auth/logout-all', userController.logoutAll);
app.post('/api/auth/refresh', userController.refresh);
app.get('/api/auth/me', protect, userController.me);
app.post('/api/auth/update-password', protect, validate(updatePasswordSchema), userController.updatePassword);

// Customer Store & Rating Endpoints
app.get('/api/stores', protect, restrictTo('user'), storeController.getStores);
app.post('/api/ratings', protect, restrictTo('user'), validate(submitRatingSchema), storeController.submitRating);

// Store Owner Dashboard Endpoint
app.get('/api/store/dashboard', protect, restrictTo('owner'), storeController.getStoreDashboard);

// Administrative Management Endpoints
app.get('/api/admin/stats', protect, restrictTo('admin'), adminController.getStats);
app.post('/api/admin/users', protect, restrictTo('admin'), validate(adminCreateUserSchema), adminController.addUser);
app.get('/api/admin/users', protect, restrictTo('admin'), adminController.getUsers);
app.get('/api/admin/stores', protect, restrictTo('admin'), adminController.getStores);
app.get('/api/admin/users/:id', protect, restrictTo('admin'), adminController.getUserById);
app.post('/api/admin/users/reset-password', protect, restrictTo('admin'), validate(adminResetPasswordSchema), adminController.resetPassword);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Server Unhandled Error:', err);
  res.status(500).json({
    status: 'error',
    message: 'An unexpected error occurred on the server.'
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
