import { Review } from "../models/reviewModel.js";
import { MealKit } from "../models/mealKitModel.js";
import userModel from "../models/userModel.js";
import mongoose from 'mongoose';

// Submit a review for a meal kit
export const submitReview = async (req, res) => {
    try {
        const { mealKitId, rating, comment, userId } = req.body;
        
        // Validate input
if (!mealKitId || rating === undefined) {
    return res.status(400).json({ 
        success: false,
        message: "Meal kit ID and rating are required" 
    });
}

if (rating < 1 || rating > 5) {
    return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5"
    });
}


        // Check if meal kit exists
        const mealKit = await MealKit.findById(mealKitId);
        if (!mealKit) {
            return res.status(404).json({ 
                success: false,
                message: "Meal kit not found" 
            });
        }

        // Check for existing review
        const existingReview = await Review.findOne({ 
            author: userId, 
            mealkit: mealKitId 
        });
        
        if (existingReview) {
            return res.status(400).json({ 
                success: false,
                message: "You've already reviewed this meal kit" 
            });
        }

        // Create new review
        const newReview = new Review({
            author: userId,
            mealkit: mealKitId,
            rating,
            comment
        });

        await newReview.save();
        const allReviews = await Review.find({ mealkit: mealKitId });
        
        // Calculate average rating
        const totalRating = allReviews.reduce((sum, review) => sum + review.rating, 0);
        const averageRating = allReviews.length > 0 ? (totalRating / allReviews.length).toFixed(1) : 0;
        
        // Update the MealKit document
        await MealKit.findByIdAndUpdate(mealKitId, {
            rating: averageRating,
            reviewCount: allReviews.length
        });

        // Get populated review to return
        const populatedReview = await Review.findById(newReview._id)
            .populate('author', 'name');

        res.status(201).json({
            success: true,
            message: "Review submitted successfully",
            review: populatedReview
        });
    } catch (error) {
        console.error("Error submitting review:", error);
        res.status(500).json({ 
            success: false, 
            message: "Error submitting review",
            error: error.message 
        });
    }
};

export const getMealKitReviews = async (req, res) => {
    try {
        const { mealKitId } = req.params;
        
        // Add validation
        if (!mongoose.Types.ObjectId.isValid(mealKitId)) {
            return res.status(400).json({ 
                success: false, 
                message: "Invalid meal kit ID format" 
            });
        }

        const reviews = await Review.find({ mealkit: mealKitId })
            .populate({
                path: 'author',
                select: 'name profilePicture' 
            })
            .sort({ createdAt: -1 });
        
        res.json({
            success: true,
            count: reviews.length,
            reviews
        });
    } catch (error) {
        console.error("Error fetching reviews:", error);
        res.status(500).json({ 
            success: false, 
            message: "Error fetching reviews",
            error: error.message 
        });
    }
};

export const editReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const { userId, rating, comment } = req.body;
        
        // Validate input
        if (!rating && !comment) {
            return res.status(400).json({ 
                success: false,
                message: "Rating or comment is required for update" 
            });
        }

        if (rating && (rating < 1 || rating > 5)) {
            return res.status(400).json({
                success: false,
                message: "Rating must be between 1 and 5"
            });
        }

        // Find and validate the review
        const review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).json({ 
                success: false, 
                message: "Review not found" 
            });
        }
        
        if (review.author.toString() !== userId) {
            return res.status(403).json({ 
                success: false, 
                message: "You can only edit your own reviews" 
            });
        }
        
        // Prepare update
        const updateFields = { edited: true };
        if (rating !== undefined) updateFields.rating = rating;
        if (comment !== undefined) updateFields.comment = comment;

        // Update review
        const updatedReview = await Review.findByIdAndUpdate(
            reviewId,
            updateFields,
            { new: true }
        ).populate('author', 'name');

        // Update meal kit rating if rating changed
        if (rating !== undefined) {
            await updateMealKitRating(review.mealkit);
        }

        res.json({
            success: true,
            message: "Review updated successfully",
            review: updatedReview
        });
    } catch (error) {
        console.error("Error editing review:", error);
        res.status(500).json({ 
            success: false, 
            message: "Error editing review",
            error: error.message 
        });
    }
};

// Helper function to update meal kit rating
async function updateMealKitRating(mealKitId) {
    const allReviews = await Review.find({ mealkit: mealKitId });
    const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = allReviews.length > 0 ? (totalRating / allReviews.length).toFixed(1) : 0;
    
    await MealKit.findByIdAndUpdate(mealKitId, {
        rating: averageRating
    });
}

// Delete a review (user can delete their own, admin can delete any)
export const deleteReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const { userId } = req.body;
        
        // Find the review
        const review = await Review.findById(reviewId);
        
        if (!review) {
            return res.status(404).json({ 
                success: false, 
                message: "Review not found" 
            });
        }
        
        // Check if user is the author or an admin
        const user = await userModel.findById(userId);
        const isAdmin = user.role === 'admin';
        const isAuthor = review.author.toString() === userId;
        
        if (!isAuthor && !isAdmin) {
            return res.status(403).json({ 
                success: false, 
                message: "You can only delete your own reviews" 
            });
        }
        
        // Delete the review
        await Review.findByIdAndDelete(reviewId);
        
        // Update meal kit ratings
        const allReviews = await Review.find({ mealkit: review.mealkit });
        const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
        const averageRating = allReviews.length > 0 ? (totalRating / allReviews.length).toFixed(1) : 0;
        
        await MealKit.findByIdAndUpdate(review.mealkit, {
            rating: averageRating,
            reviewCount: allReviews.length
        });

        res.json({
            success: true,
            message: "Review deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting review:", error);
        res.status(500).json({ 
            success: false, 
            message: "Error deleting review",
            error: error.message 
        });
    }
};

// Admin reply to a review
export const replyToReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const { reply, userId } = req.body;
        
        // Validate input
        if (!reply) {
            return res.status(400).json({ 
                success: false, 
                message: "Reply text is required" 
            });
        }
        
        // Check if user is admin
        const user = await userModel.findById(userId);
        if (user.role !== 'admin') {
            return res.status(403).json({ 
                success: false, 
                message: "Only admins can reply to reviews" 
            });
        }
                
        // Update the review with the reply
        const updatedReview = await Review.findByIdAndUpdate(
            reviewId,
            { 
                adminReply: reply,
                adminReplyDate: Date.now()
            },
            { new: true }
        ).populate('author', 'name');
        
        if (!updatedReview) {
            return res.status(404).json({ 
                success: false, 
                message: "Review not found" 
            });
        }
        
        res.json({
            success: true,
            message: "Reply added successfully",
            review: updatedReview
        });
    } catch (error) {
        console.error("Error replying to review:", error);
        res.status(500).json({ 
            success: false, 
            message: "Error replying to review",
            error: error.message 
        });
    }
};

// Admin function to get all reviews across all meal kits
export const getAllReviews = async (req, res) => {
    try {
        const { userId } = req.body;
        
        // Check if user is admin
        const user = await userModel.findById(userId);
        if (user.role !== 'admin') {
            return res.status(403).json({ 
                success: false, 
                message: "Only admins can access all reviews" 
            });
        }
        
        const reviews = await Review.find()
            .populate('author', 'name')
            .populate('mealkit', 'title')
            .sort({ createdAt: -1 });
        
        res.json({
            success: true,
            count: reviews.length,
            reviews
        });
    } catch (error) {
        console.error("Error fetching all reviews:", error);
        res.status(500).json({ 
            success: false, 
            message: "Error fetching all reviews",
            error: error.message 
        });
    }
};