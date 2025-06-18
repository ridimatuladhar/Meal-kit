import express from 'express';
import {
    createMealKit,
    updateMealKit,
    deleteMealKit,
} from '../controllers/mealKitController.js';
import upload from '../config/multerConfig.js';
import { deleteUser, getAllUsers } from '../controllers/userController.js';
import { isAdmin } from '../middleware/adminAuth.js';
import { 
    countUsers, 
    countMealKits, 
    countCompletedOrders, 
    getOrderStats 
} from '../controllers/adminController.js';

const adminRouter = express.Router();

// Meal kit management routes
adminRouter.post('/meal-kits', isAdmin, upload.single('image'), createMealKit);
adminRouter.put('/meal-kits/:id', isAdmin, upload.single('image'), updateMealKit);
adminRouter.delete('/meal-kits/:id', isAdmin, deleteMealKit);

// User management routes
adminRouter.get("/users", isAdmin, getAllUsers);
adminRouter.delete("/delete-user", isAdmin, deleteUser);

// Dashboard stats routes
adminRouter.get('/count-users', isAdmin, countUsers);
adminRouter.get('/count-meal-kits', isAdmin, countMealKits);
adminRouter.get('/count-completed-orders', isAdmin, countCompletedOrders);
adminRouter.get('/order-stats', isAdmin, getOrderStats);

export default adminRouter;