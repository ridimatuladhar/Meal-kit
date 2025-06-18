import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  mealKit: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MealKit',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  title: String,
  image: String
}, { _id: false });

const statusHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'],
    required: true
  },
  note: String
}, { timestamps: true, _id: false });

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  orderNumber: {
    type: String,
    unique: true
  },
  items: [orderItemSchema],
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['khalti', 'cod'],
    required: true
  },
  paymentDetails: {
    transactionId: String,  // Khalti transaction ID (pidx)
    paymentResponse: Object, // Store complete Khalti response
    paidAmount: Number,
    paidAt: Date
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  shippingDetails: {
    name: String,
    address: String,
    phoneNumber: String,
    deliveryInstructions: String
  },
  statusHistory: [statusHistorySchema],
  deliveredAt: Date
}, { timestamps: true });

// Auto-generate order number
orderSchema.pre('save', async function(next) {
  try {
    if (!this.isNew) return next();
    
    const prefix = 'EK';
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    
    // Find the highest order number for today
    const highestOrder = await this.constructor.findOne({
      orderNumber: new RegExp(`^${prefix}-${date}`)
    }).sort({ orderNumber: -1 });
    
    let sequenceNumber = 1;
    
    if (highestOrder) {
      // Extract the sequence number from the highest order number
      const currentSequence = parseInt(highestOrder.orderNumber.split('-')[2]);
      sequenceNumber = currentSequence + 1;
    }
    
    this.orderNumber = `${prefix}-${date}-${sequenceNumber.toString().padStart(4, '0')}`;
    
    // Record initial status
    this.statusHistory.push({
      status: this.status,
      note: 'Order created'
    });
    
    next();
  } catch (error) {
    next(error);
  }
});

// Calculate total amount before saving
orderSchema.pre('save', function(next) {
  if (this.isModified('items')) {
    this.totalAmount = this.items.reduce((total, item) => 
      total + (item.price * item.quantity), 0);
  }
  next();
});

// Status update helper
orderSchema.methods.updateStatus = function(newStatus, note = '') {
  this.status = newStatus;
  this.statusHistory.push({ status: newStatus, note });
  
  if (newStatus === 'delivered') {
    this.deliveredAt = new Date();
  }
  
  return this.save();
};

// Virtual for ongoing orders
orderSchema.virtual('isOngoing').get(function() {
  return !['delivered', 'cancelled'].includes(this.status);
});

export const Order = mongoose.model('Order', orderSchema);