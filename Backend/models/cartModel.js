import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema({
  mealKit: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MealKit',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    default: 1,
    min: 1
  }
});

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true,
    unique: true
  },
  items: [cartItemSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Pre-save hook to update timestamps
cartSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Helper method to calculate total
cartSchema.methods.calculateTotal = function() {
  return this.items.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);
};

export const Cart = mongoose.model('Cart', cartSchema);