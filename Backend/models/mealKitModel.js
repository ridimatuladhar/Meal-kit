import mongoose from "mongoose";

const mealKitSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    desc: {
        type: String,
        required: true,
    },
    image: {
        type: String,
        required: true,
    },
    // Ingredients included in the meal kit box
    ingredientsIncluded: {
        type: [String],
        required: true,
    },
    // Ingredients not included but needed for cooking
    ingredientsNotIncluded: {
        type: [String],
    },
    steps: {
        type: [String],
        required: true,
    },
    tags: {
        type: [String],
        required: true,
    },
    ctime: {
        type: Number,
        required: true,
    },
    ptime: {
        type: Number,
        required: true,
    },
    servings: {
        type: Number,
        required: true,
    },
    availability: {
        type: String,
        enum: ["Available", "Out of Stock"], 
        default: "Available", 
    },
    price: {
        type: Number,
        required: true,
        min: 0, // Ensure price is not negative
    },
    rating: {
        type: Number,
        default: 0, 
        min: 0,
        max: 5, 
    },
    ratingCount: {
        type: Number,
        default: 0
    },
    reviews: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Review',
        },
    ],
});

export const MealKit = mongoose.model("MealKit", mealKitSchema);