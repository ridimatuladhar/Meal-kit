import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from "cookie-parser";
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import authRouter from './routes/authRoutes.js';
import userRouter from './routes/userRoutes.js';
import adminRouter from './routes/adminRoutes.js';
import cartRouter from './routes/cartRoutes.js';
import reviewRouter from './routes/reviewRoutes.js';
import fs from 'fs';
import orderRouter from './routes/orderRoutes.js';

// Get current directory with ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Create subdirectories for different types of uploads
const mealKitsDir = path.join(uploadsDir, 'meal-kits');
if (!fs.existsSync(mealKitsDir)) {
  fs.mkdirSync(mealKitsDir, { recursive: true });
}

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  dbName: process.env.DB_NAME,
})
.then(() => console.log("Connection to MongoDB successful"))
.catch((err) => console.log(err.message));

// Middleware to parse JSON
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5173", 
    credentials: true, 
  })
);

// http://localhost:3000/uploads/meal-kits/filename.jpg
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.get('/', (req, res) => res.send("API working"));
app.use('/api/auth', authRouter);
app.use('/api/user', userRouter);
app.use('/api/admin', adminRouter);
app.use('/api/cart', cartRouter);
app.use('/api/review', reviewRouter);
app.use('/api/order',orderRouter)

// Error handling middleware
app.use((err, req, res, next) => {
  // Handle multer errors (file uploads)
  if (err.name === 'MulterError') {
    let errorMessage = 'File upload error';
    
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        errorMessage = 'File size too large. Maximum 5MB allowed.';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        errorMessage = 'Unexpected field or too many files uploaded.';
        break;
      default:
        errorMessage = err.message;
    }
    
    return res.status(400).json({ success: false, message: errorMessage });
  }
  
  // Handle other errors
  console.error(err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// Start the server
app.listen(port, () => console.log(`Server is running on port ${port}`));