import userModel from '../models/userModel.js';
import { MealKit } from '../models/mealKitModel.js';


export const addToFavorites = async (req, res) => {
    try {
        const { userId, mealKitId } = req.body;

        // Validate inputs
        if (!userId || !mealKitId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid request parameters' 
            });
        }

        // Validate user and meal kit
        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: "User not found" 
            });
        }

        const mealKit = await MealKit.findById(mealKitId);
        if (!mealKit) {
            return res.status(404).json({ 
                success: false, 
                message: "Meal kit not found" 
            });
        }

        // Add meal kit to favorites if not already added
        if (!user.favorites.includes(mealKitId)) {
            user.favorites.push(mealKitId);
            await user.save();
        }

        res.status(200).json({ 
            success: true, 
            message: "Meal kit added to favorites", 
            favorites: user.favorites 
        });
    } catch (error) {
        console.error('Add to favorites error:', error);
        res.status(500).json({ 
            success: false, 
            message: "Error adding to favorites", 
            error: error.message 
        });
    }
};

export const removeFromFavorites = async (req, res) => {
    try {
        const { userId, mealKitId } = req.body;

        // Validate inputs
        if (!userId || !mealKitId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid request parameters' 
            });
        }

        // Validate user
        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: "User not found" 
            });
        }

        // Remove meal kit from favorites
        user.favorites = user.favorites.filter(id => id.toString() !== mealKitId);
        await user.save();

        res.status(200).json({ 
            success: true, 
            message: "Meal kit removed from favorites", 
            favorites: user.favorites 
        });
    } catch (error) {
        console.error('Remove from favorites error:', error);
        res.status(500).json({ 
            success: false, 
            message: "Error removing from favorites", 
            error: error.message 
        });
    }
};


export const getFavorites = async (req, res) => {
    try {
        const { userId } = req.body;

        // Validate user and populate favorites
        const user = await userModel.findById(userId)
            .populate('favorites');
            
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: "User not found" 
            });
        }

        res.status(200).json({ 
            success: true, 
            favorites: user.favorites 
        });
    } catch (error) {
        console.error('Get favorites error:', error);
        res.status(500).json({ 
            success: false, 
            message: "Error fetching favorites", 
            error: error.message 
        });
    }
};


export const checkFavorite = async (req, res) => {
    try {
        const { userId } = req.body;
        const { mealKitId } = req.params;

        // Validate inputs
        if (!userId || !mealKitId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid request parameters' 
            });
        }

        // Validate user
        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: "User not found" 
            });
        }

        // Check if meal kit is in favorites
        const isFavorite = user.favorites.some(id => id.toString() === mealKitId);

        res.status(200).json({ 
            success: true, 
            isFavorite 
        });
    } catch (error) {
        console.error('Check favorite error:', error);
        res.status(500).json({ 
            success: false, 
            message: "Error checking favorite status", 
            error: error.message 
        });
    }
};