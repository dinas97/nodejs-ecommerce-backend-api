require('dotenv').config();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const connectDB = require('./DB/connection');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const productRoutes = require('./routes/product.routes');

const app = express();

// --- Connect to MongoDB ---
connectDB();

// --- Global Middleware ---
app.use(cors());
app.use(express.json());
app.use(cookieParser());

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// --- Routes ---
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/products', productRoutes);

app.get('/', (req, res) => {
  res.status(200).json({ success: true, message: 'Ecommerce API is running' });
});

// --- 404 handler ---
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// --- Global error handler ---
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
