import express from 'express';
import userAuth from '../middleware/userAuth.js';
import {
    getAllMealKits,
    getMealKitById
} from '../controllers/mealKitController.js';
import { getUserData, updateUserField } from '../controllers/userController.js';
import { addToFavorites, checkFavorite, getFavorites, removeFromFavorites } from '../controllers/favouriteController.js';


const userRouter = express.Router();
userRouter.get('/data', userAuth, getUserData);
userRouter.patch('/update', userAuth, updateUserField);

// Get all meal kits (accessible to both admin and user)
userRouter.get('/meal-kits', getAllMealKits);
// Get a specific meal kit by ID (accessible to both admin and user)
userRouter.get('/meal-kits/:id', getMealKitById);

// Add a meal kit to favorites (user-only)
userRouter.post('/favourites/add', userAuth, addToFavorites);
userRouter.post('/favourites/remove', userAuth, removeFromFavorites);
userRouter.get('/favourites/check/:mealKitId', userAuth, checkFavorite);
userRouter.get('/favourites', userAuth, getFavorites);


export default userRouter;