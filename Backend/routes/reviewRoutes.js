// import express from 'express';
// import {
//   submitReview,
//   replyToReview,
//   getMealKitReviews,
//   deleteReview,
//   getAllReviews,
//   editReview
// } from '../controllers/reviewController.js';
// import userAuth from '../middleware/userAuth.js';
// import { isAdmin } from '../middleware/adminAuth.js';

// const reviewRouter = express.Router();

// // @access  Private
// reviewRouter.post('/', userAuth, submitReview);

// reviewRouter.put('/admin/:reviewId/reply', isAdmin, replyToReview);
// reviewRouter.get('/meal-kit/:mealKitId', getMealKitReviews);
// // @access  Private (owner or admin)
// reviewRouter.delete('/:reviewId', userAuth, deleteReview);
// reviewRouter.delete('/:reviewId', userAuth, editReview);
// reviewRouter.get('/all', userAuth, isAdmin, getAllReviews);
// reviewRouter.delete('/admin/:reviewId',isAdmin, deleteReview);
// export default reviewRouter;


import express from 'express';
import {
  submitReview,
  replyToReview,
  getMealKitReviews,
  deleteReview,
  getAllReviews,
  editReview
} from '../controllers/reviewController.js';
import userAuth from '../middleware/userAuth.js';
import { isAdmin } from '../middleware/adminAuth.js';
import { Review } from '../models/reviewModel.js';

const reviewRouter = express.Router();

// Submit a review (protected - logged in users)
reviewRouter.post('/', userAuth, submitReview);

// Get reviews for a meal kit (public)
reviewRouter.get('/meal-kit/:mealKitId', getMealKitReviews);

// Edit a review (protected - owner only)
reviewRouter.put('/:reviewId', userAuth, editReview);

// Delete a review (protected - owner or admin)
reviewRouter.delete('/:reviewId', userAuth, deleteReview);

// Get all reviews by the current user
// In your reviewRouter.js
reviewRouter.get('/user-reviews', userAuth, async (req, res) => {
  try {
    const reviews = await Review.find({ author: req.body.userId })
      .populate('mealkit', 'title');
    res.json({ success: true, reviews });
  } catch (error) {
    console.error("Error fetching user reviews:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error fetching user reviews",
      error: error.message 
    });
  }
});

// ADMIN ROUTES //

// Reply to a review (admin only)
reviewRouter.put('/:reviewId/reply', userAuth, isAdmin, replyToReview);

// Get all reviews across all meal kits (admin only)
reviewRouter.get('/', userAuth, isAdmin, getAllReviews);

export default reviewRouter;