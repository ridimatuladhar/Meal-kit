import { MealKit } from "../models/mealKitModel.js";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get all meal kits (accessible to both admin and user)
export const getAllMealKits = async (req, res) => {
    try {
        const mealKits = await MealKit.find();
        res.status(200).json(mealKits);
    } catch (error) {
        res.status(500).json({ message: "Error fetching meal kits", error: error.message });
    }
};

// Get a specific meal kit by ID (accessible to both admin and user)
export const getMealKitById = async (req, res) => {
    try {
        const mealKit = await MealKit.findById(req.params.id);
        if (!mealKit) {
            return res.status(404).json({ message: "Meal kit not found" });
        }
        res.status(200).json(mealKit);
    } catch (error) {
        res.status(500).json({ message: "Error fetching meal kit", error: error.message });
    }
};

// Add a new meal kit with image upload (admin-only)
export const createMealKit = async (req, res) => {
    try {
        // Get file path if an image was uploaded
        let imagePath = '';
        if (req.file) {
            imagePath = `/uploads/meal-kits/${req.file.filename}`;
        } else if (!req.body.image) {
            return res.status(400).json({ message: "Image is required" });
        } else {
            imagePath = req.body.image; 
        }

        const {
            title,
            desc,
            ingredientsIncluded,
            ingredientsNotIncluded,
            steps,
            tags,
            ctime,
            ptime,
            servings,
            availability,
            price,
            rating,
        } = req.body;

        // Validate required fields
        if (!title || !desc || !ingredientsIncluded || !steps || !tags || !ctime || !ptime || !servings || !price) {
            // If validation fails and we uploaded a file, delete it
            if (req.file) {
                const filePath = path.join(__dirname, '..', req.file.path);
                fs.unlinkSync(filePath);
            }
            return res.status(400).json({ message: "All fields are required" });
        }

        // Parse arrays that come as JSON strings from form data
        const parsedIngredientsIncluded = typeof ingredientsIncluded === 'string' 
            ? JSON.parse(ingredientsIncluded) 
            : ingredientsIncluded;
            
        const parsedIngredientsNotIncluded = ingredientsNotIncluded && typeof ingredientsNotIncluded === 'string' 
            ? JSON.parse(ingredientsNotIncluded) 
            : ingredientsNotIncluded || [];
            
        const parsedSteps = typeof steps === 'string' 
            ? JSON.parse(steps) 
            : steps;
            
        const parsedTags = typeof tags === 'string' 
            ? JSON.parse(tags) 
            : tags;

        const newMealKit = new MealKit({
            title,
            desc,
            image: imagePath,
            ingredientsIncluded: parsedIngredientsIncluded,
            ingredientsNotIncluded: parsedIngredientsNotIncluded,
            steps: parsedSteps,
            tags: parsedTags,
            ctime: Number(ctime),
            ptime: Number(ptime),
            servings: Number(servings),
            availability: availability || "Available",
            price: Number(price),
            rating: rating ? Number(rating) : 0,
        });

        await newMealKit.save();
        res.status(201).json({ message: "Meal kit created successfully", mealKit: newMealKit });
    } catch (error) {
        // If error occurs and we uploaded a file, delete it
        if (req.file) {
            const filePath = path.join(__dirname, '..', 'uploads', 'meal-kits', req.file.filename);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }
        res.status(500).json({ message: "Error creating meal kit", error: error.message });
    }
};

// Update a meal kit with image upload (admin-only)
export const updateMealKit = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Validate if the meal kit exists
        const mealKit = await MealKit.findById(id);
        if (!mealKit) {
            return res.status(404).json({ message: "Meal kit not found" });
        }
        
        // Prepare updated data
        const updatedData = { ...req.body };
        
        // Handle image upload
        if (req.file) {
            // If there's a new file, get its path
            updatedData.image = `/uploads/meal-kits/${req.file.filename}`;
            
            // Delete old image if it's stored locally
            if (mealKit.image && mealKit.image.startsWith('/uploads/')) {
                const oldImagePath = path.join(__dirname, '..', mealKit.image);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }
        }
        
        // Parse arrays that come as JSON strings from form data
        if (updatedData.ingredientsIncluded && typeof updatedData.ingredientsIncluded === 'string') {
            updatedData.ingredientsIncluded = JSON.parse(updatedData.ingredientsIncluded);
        }
        
        if (updatedData.ingredientsNotIncluded && typeof updatedData.ingredientsNotIncluded === 'string') {
            updatedData.ingredientsNotIncluded = JSON.parse(updatedData.ingredientsNotIncluded);
        }
        
        if (updatedData.steps && typeof updatedData.steps === 'string') {
            updatedData.steps = JSON.parse(updatedData.steps);
        }
        
        if (updatedData.tags && typeof updatedData.tags === 'string') {
            updatedData.tags = JSON.parse(updatedData.tags);
        }
        
        // Convert numeric fields
        if (updatedData.ctime) updatedData.ctime = Number(updatedData.ctime);
        if (updatedData.ptime) updatedData.ptime = Number(updatedData.ptime);
        if (updatedData.servings) updatedData.servings = Number(updatedData.servings);
        if (updatedData.price) updatedData.price = Number(updatedData.price);
        if (updatedData.rating) updatedData.rating = Number(updatedData.rating);

        const updatedMealKit = await MealKit.findByIdAndUpdate(id, updatedData, { new: true });
        res.status(200).json({ message: "Meal kit updated successfully", mealKit: updatedMealKit });
    } catch (error) {
        // If error occurs and we uploaded a file, delete it
        if (req.file) {
            const filePath = path.join(__dirname, '..', 'uploads', 'meal-kits', req.file.filename);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }
        res.status(500).json({ message: "Error updating meal kit", error: error.message });
    }
};

// Delete a meal kit (admin-only)
export const deleteMealKit = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate if the meal kit exists
        const mealKit = await MealKit.findById(id);
        if (!mealKit) {
            return res.status(404).json({ message: "Meal kit not found" });
        }

        // Delete associated image if it's stored locally
        if (mealKit.image && mealKit.image.startsWith('/uploads/')) {
            const imagePath = path.join(__dirname, '..', mealKit.image);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        await MealKit.findByIdAndDelete(id);
        res.status(200).json({ message: "Meal kit deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting meal kit", error: error.message });
    }
};

// Count total number of meal kits
// export const countMealKits = async (req, res) => {
//     try {
//       const mealKitCount = await MealKit.countDocuments({});
//       res.json({ success: true, mealKitCount });
//     } catch (error) {
//       res.json({ success: false, message: error.message });
//     }
//   };