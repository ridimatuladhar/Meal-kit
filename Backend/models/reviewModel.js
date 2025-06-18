import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String
    },
    date: {
        type: Date,
        default: Date.now
    },
    mealkit: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MealKit',
        required: true
    },
    // Admin reply fields
    adminReply: {
        type: String,
        default: null
    },
    adminReplyDate: {
        type: Date,
        default: Date.now
    }
});

export const Review = mongoose.model("Review", reviewSchema);