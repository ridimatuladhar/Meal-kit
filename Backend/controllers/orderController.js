import { Order } from '../models/orderModel.js';
import { Cart } from '../models/cartModel.js';
import { MealKit } from '../models/mealKitModel.js';
import userModel from '../models/userModel.js';
import axios from 'axios';
import dotenv from 'dotenv';
import transporter from '../config/nodemailer.js';
dotenv.config();
const KHALTI_BASE_URL = 'https://a.khalti.com/api/v2/';
const KHALTI_SECRET_KEY = process.env.KHALTI_SECRET_KEY;
//console.log("checking Khalti secret key:", KHALTI_SECRET_KEY);


const headers = {
  'Authorization': `Key 66bca2604d764758b9c7a145b9a589ad`,
  'Content-Type': 'application/json'
};

const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PREPARING: 'preparing',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled'
};

const PAYMENT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded'
};

// Helper function to validate order data
const validateOrderData = (data) => {
  const { paymentMethod, shippingDetails } = data;
  if (!paymentMethod || !shippingDetails) return false;

  const requiredShippingFields = ['name', 'address', 'phoneNumber'];
  return requiredShippingFields.every(field => shippingDetails[field]);
};


// Create a new order
export const createOrder = async (req, res) => {
  try {
    const userId = req.body.userId;

    if (!validateOrderData(req.body)) {
      return res.status(400).json({
        success: false,
        message: 'Missing required order details'
      });
    }

    const cart = await Cart.findOne({ user: userId }).populate('items.mealKit');

    if (!cart?.items?.length) {
      return res.status(400).json({
        success: false,
        message: 'Your cart is empty'
      });
    }

    const orderItems = cart.items.map(item => {

      if (!item.mealKit || !item.mealKit._id) {
        console.log('Invalid item:', item);
        throw new Error(`Invalid meal kit data for cart item`);
      }
      return {
        mealKit: item.mealKit._id.toString(),
        quantity: item.quantity,
        price: item.mealKit.price,
        title: item.mealKit.title,
        image: item.mealKit.image
      };
    });
    const totalAmount = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const orderData = {
      user: userId,
      items: orderItems,
      totalAmount,
      ...req.body,
      status: req.body.paymentMethod === 'cod' ? ORDER_STATUS.CONFIRMED : ORDER_STATUS.PENDING,
      paymentStatus: PAYMENT_STATUS.PENDING
    };
    const newOrder = await Order.create(orderData);

    // Clear cart in parallel with order creation
    await Cart.updateOne({ user: userId }, { $set: { items: [] } });
    const user = await userModel.findById(userId);

    if (user && user.email) {
      // Format order items for email
      const itemsList = orderItems.map(item =>
        `${item.title} x ${item.quantity} - Rs. ${item.price * item.quantity}`
      ).join('\n');

      // Send order confirmation email
      await transporter.sendMail({
        from: process.env.SENDER_EMAIL,
        to: user.email,
        subject: `Easy-Khana Order Confirmation #${newOrder.orderNumber}`,
        text:
          `Dear ${user.name},

Thank you for your order with Easy-Khana!

Order Details:
Order Number: ${newOrder.orderNumber}
Date: ${new Date().toLocaleDateString()}
Total Amount: Rs. ${newOrder.totalAmount}

Items Ordered:
${itemsList}

Shipping Address:
${orderData.shippingDetails.name}
${orderData.shippingDetails.address}
${orderData.shippingDetails.phoneNumber}

Payment Method: ${orderData.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Khalti'}
Payment Status: ${newOrder.paymentStatus}

You can check your order status anytime in the "My Orders" section of your profile.

Thank you for choosing Easy-Khana!

Best regards,
The Easy-Khana Team
`,
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order: {
        id: newOrder._id,
        orderNumber: newOrder.orderNumber,
        totalAmount: newOrder.totalAmount,
        status: newOrder.status
      }
    });

  } catch (error) {
    console.error('Create order error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: error.message
    });
  }
};


const pendingKhaltiOrders = new Map();

// Helper function to clean old pending orders (prevent memory leaks)
const cleanupPendingOrders = () => {
  const now = Date.now();
  const expiryTime = 30 * 60 * 1000; // 30 minutes

  for (const [key, value] of pendingKhaltiOrders.entries()) {
    if (now - value.timestamp > expiryTime) {
      pendingKhaltiOrders.delete(key);
    }
  }
};

setInterval(cleanupPendingOrders, 10 * 60 * 1000);

// Create order with Khalti payment
export const createOrderKhalti = async (req, res) => {
  try {
    const { amount, return_url, website_url, shippingDetails } = req.body;

    // Validate required fields
    if (!amount || !return_url || !website_url || !shippingDetails?.name || !shippingDetails?.phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Validate Khalti key
    if (!KHALTI_SECRET_KEY) {
      throw new Error('Khalti secret key is not configured');
    }

    const timestamp = Date.now();

    const payload = {
      return_url,
      website_url,
      amount: Math.round(amount), // Amount should be in paisa
      purchase_order_id: `ORDER-${timestamp}`,
      purchase_order_name: `Order-${timestamp}`,
      customer_info: {
        name: shippingDetails.name,
        phone: shippingDetails.phoneNumber.replace(/\D/g, '') // Strip non-digits
      }
    };

    console.log('Making Khalti request with:', {
      url: `${KHALTI_BASE_URL}epayment/initiate/`,
      headers,
      payload
    });

    const response = await axios.post(
      `${KHALTI_BASE_URL}epayment/initiate/`,
      payload,
      { headers, timeout: 10000 }
    );

    console.log('Khalti response:', response.data);

    const transactionId = response.data.pidx;
    pendingKhaltiOrders.set(transactionId, {
      orderData: req.body,
      timestamp: Date.now()
    });

    try {
      // Get user details
      const user = await userModel.findById(userId);

      if (user && user.email) {
        // Format order items for email if available
        let itemsList = "Your items will be confirmed after payment";
        const amountInRs = amount / 100; // Convert paisa to rupees

        if (req.body.items && Array.isArray(req.body.items)) {
          itemsList = req.body.items.map(item =>
            `${item.title} x ${item.quantity} - Rs. ${item.price * item.quantity}`
          ).join('\n');
        }

        // Generate temporary order number
        const tempOrderNum = `TEMP-${timestamp}`;

        // Send payment initiation email
        await transporter.sendMail({
          from: process.env.SENDER_EMAIL,
          to: user.email,
          subject: `Easy-Khana Payment Initiated #${tempOrderNum}`,
          text:
            `Dear ${user.name},

Thank you for choosing Easy-Khana! Your order is being processed.

Payment Details:
Temporary Order Number: ${tempOrderNum}
Date: ${new Date().toLocaleDateString()}
Total Amount: Rs. ${amountInRs.toFixed(2)}

${req.body.items ? 'Items Ordered:\n' + itemsList : 'Your items will be confirmed after payment'}

Shipping Address:
${shippingDetails.name}
${shippingDetails.address}
${shippingDetails.phoneNumber}

Payment Method: Khalti
Payment Status: Initiated

You have been redirected to the Khalti payment gateway to complete your payment.
After successful payment, your order will be confirmed, and you'll receive another email.

Thank you for choosing Easy-Khana!

Best regards,
The Easy-Khana Team
`,
        });
      }
    } catch (emailError) {
      // Log email error but don't fail the API response
      console.error('Failed to send payment initiation email:', emailError);
    }

    return res.status(200).json({
      success: true,
      message: 'Payment initiated',
      data: response.data,
      transactionId
    });

  } catch (error) {
    console.error('Khalti payment error:', {
      message: error.message,
      response: error.response?.data
    });

    return res.status(500).json({
      success: false,
      message: error.response?.data?.detail || 'Failed to initiate payment',
      error: error.message
    });
  }
};

export const verifyKhaltiPayment = async (req, res) => {
  try {
    const { pidx, transactionId } = req.body;

    // Retrieve the pending order data
    if (!pendingKhaltiOrders.has(transactionId)) {
      return res.status(400).json({
        success: false,
        message: "No pending order found for this transaction"
      });
    }

    const pendingOrder = pendingKhaltiOrders.get(transactionId);
    const userId = pendingOrder.orderData.userId;

    // Verify payment with Khalti
    const response = await axios.post(
      `${KHALTI_BASE_URL}epayment/lookup/`,
      { pidx },
      { headers }
    );

    if (response.data.status !== "Completed") {
      await sendPaymentEmail(userId, null, "failed", pendingOrder.orderData);
      return res.status(400).json({
        success: false,
        message: "Payment not completed yet."
      });
    }

    // Fetch the user's cart and build the items array
    const cart = await Cart.findOne({ user: userId }).populate('items.mealKit');
    let orderItems = [];
    let totalAmount = 0;
    if (cart && cart.items && cart.items.length > 0) {
      orderItems = cart.items.map(item => ({
        mealKit: item.mealKit._id,
        quantity: item.quantity,
        price: item.mealKit.price,
        title: item.mealKit.title,
        image: item.mealKit.image
      }));
      totalAmount = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }

    // Validate response data
    const paidAmount = response.data.total_amount ? response.data.total_amount / 100 : 0;
    if (!paidAmount || isNaN(paidAmount)) {
      await sendPaymentEmail(userId, null, "failed", pendingOrder.orderData);
      return res.status(400).json({
        success: false,
        message: "Invalid payment amount received from Khalti."
      });
    }

    // Now create the actual order since payment is verified
    const newOrder = await Order.create({
      user: userId,
      items: orderItems,
      totalAmount: totalAmount,
      shippingDetails: pendingOrder.orderData.shippingDetails,
      status: ORDER_STATUS.CONFIRMED,
      paymentMethod: "khalti",
      paymentStatus: PAYMENT_STATUS.COMPLETED,
      paymentDetails: {
        transactionId: pidx,
        paymentResponse: response.data,
        paidAmount,
        paidAt: new Date()
      }
    });

    // Send success email with order details
    await sendPaymentEmail(userId, newOrder, "completed", pendingOrder.orderData);

    // Clear cart
    await Cart.updateOne(
      { user: userId },
      { $set: { items: [] } }
    );

    // Remove the pending order from memory
    pendingKhaltiOrders.delete(transactionId);

    return res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
      order: {
        id: newOrder._id,
        orderNumber: newOrder.orderNumber,
        status: newOrder.status,
        paymentStatus: newOrder.paymentStatus
      }
    });

  } catch (error) {
    console.error('Payment verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Payment verification failed',
      error: error.message
    });
  }
};

// Helper function to send payment emails
const sendPaymentEmail = async (userId, order, status, orderData) => {
  try {
    const user = await userModel.findById(userId);
    if (!user || !user.email) return;

    let subject, text;

    if (status === "completed" && order) {
      // Format order items for email
      const itemsList = order.items.map(item =>
        `${item.title} x ${item.quantity} - Rs. ${item.price * item.quantity}`
      ).join('\n');

      subject = `Easy-Khana Order Confirmation #${order.orderNumber}`;
      text = `Dear ${user.name},

Great news! Your payment has been successfully processed and your order is confirmed.

Order Details:
Order Number: ${order.orderNumber}
Date: ${new Date(order.createdAt).toLocaleDateString()}
Total Amount: Rs. ${order.totalAmount}

Items Ordered:
${itemsList}

Shipping Address:
${orderData.shippingDetails.name}
${orderData.shippingDetails.address}
${orderData.shippingDetails.phoneNumber}

Payment Method: Khalti
Payment Status: Completed

You can check your order status anytime in the "My Orders" section of your profile.

Thank you for choosing Easy-Khana!

Best regards,
The Easy-Khana Team`;

    } else {
      // Payment failed
      const amountInRs = orderData.amount ? orderData.amount / 100 : 0;

      subject = `Easy-Khana Payment Failed`;
      text = `Dear ${user.name},

We're sorry, but we encountered an issue processing your payment through Khalti.

Payment Details:
Date: ${new Date().toLocaleDateString()}
Amount: Rs. ${amountInRs.toFixed(2)}
Payment Method: Khalti
Payment Status: Failed

Please try placing your order again, or consider using an alternative payment method.
If you continue to experience issues, please contact our customer support.

Thank you for your understanding.

Best regards,
The Easy-Khana Team`;
    }

    await transporter.sendMail({
      from: process.env.SENDER_EMAIL,
      to: user.email,
      subject,
      text
    });
  } catch (emailError) {
    // Log error but don't throw - we don't want email failures to affect API response
    console.error('Failed to send payment status email:', emailError);
  }
};


export const getUserOrders = async (req, res) => {
  try {
    const userId = req.body.userId;
    const { status, limit = 10, page = 1 } = req.query;

    const query = { user: userId };

    if (status) {
      query.status = status === 'ongoing'
        ? { $in: [ORDER_STATUS.PENDING, ORDER_STATUS.CONFIRMED, ORDER_STATUS.PREPARING, ORDER_STATUS.OUT_FOR_DELIVERY] }
        : status === 'previous'
          ? { $in: [ORDER_STATUS.DELIVERED, ORDER_STATUS.CANCELLED] }
          : status;
    }

    const [orders, total] = await Promise.all([
      Order.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit)),
      Order.countDocuments(query)
    ]);

    return res.status(200).json({
      success: true,
      orders,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get user orders error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve orders',
      error: error.message
    });
  }
};

// Get order details with authorization check
export const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.body.userId;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const user = await userModel.findById(userId);
    if (order.user.toString() !== userId && user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }

    return res.status(200).json({
      success: true,
      order
    });

  } catch (error) {
    console.error('Get order details error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve order details',
      error: error.message
    });
  }
};

// Cancel order with validation
export const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.body.userId;
    const { reason } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.user.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized operation'
      });
    }

    if ([ORDER_STATUS.DELIVERED, ORDER_STATUS.CANCELLED].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: `Order already ${order.status}`
      });
    }

    if (order.status === ORDER_STATUS.OUT_FOR_DELIVERY) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel order in delivery'
      });
    }

    await order.updateStatus(ORDER_STATUS.CANCELLED, reason || 'User cancelled');

    if (order.paymentStatus === PAYMENT_STATUS.COMPLETED) {
      order.paymentStatus = PAYMENT_STATUS.REFUNDED;
      await order.save();
      // Add refund processing logic here
    }

    return res.status(200).json({
      success: true,
      message: 'Order cancelled',
      order: {
        id: order._id,
        status: order.status
      }
    });

  } catch (error) {
    console.error('Cancel order error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to cancel order',
      error: error.message
    });
  }
};

// Admin order status update
export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, note } = req.body;

    if (!Object.values(ORDER_STATUS).includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    await order.updateStatus(status, note || `Status updated to ${status}`);

    if (status === ORDER_STATUS.DELIVERED && order.paymentMethod === 'cod') {
      order.paymentStatus = PAYMENT_STATUS.COMPLETED;
      order.paymentDetails = {
        paidAmount: order.totalAmount,
        paidAt: new Date()
      };
      await order.save();
    }

    return res.status(200).json({
      success: true,
      message: 'Order status updated',
      order: {
        id: order._id,
        status: order.status
      }
    });

  } catch (error) {
    console.error('Update order status error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update order status',
      error: error.message
    });
  }
};

// Get all orders with advanced filtering
// export const getAllOrders = async (req, res) => {
//   try {
//     const { status, limit = 10, page = 1, sort = 'latest' } = req.query;

//     const query = {};
//     if (status) {
//       query.status = status === 'ongoing'
//         ? { $in: [ORDER_STATUS.PENDING, ORDER_STATUS.CONFIRMED, ORDER_STATUS.PREPARING, ORDER_STATUS.OUT_FOR_DELIVERY] }
//         : status === 'previous'
//           ? { $in: [ORDER_STATUS.DELIVERED, ORDER_STATUS.CANCELLED] }
//           : status;
//     }

//     const sortOptions = {
//       latest: { createdAt: -1 },
//       oldest: { createdAt: 1 },
//       highest: { totalAmount: -1 },
//       lowest: { totalAmount: 1 }
//     }[sort] || { createdAt: -1 };

//     const [orders, total] = await Promise.all([
//       Order.find(query)
//         .populate('user', 'name email phoneNumber')
//         .sort(sortOptions)
//         .skip((page - 1) * limit)
//         .limit(parseInt(limit)),
//       Order.countDocuments(query)
//     ]);

//     return res.status(200).json({
//       success: true,
//       orders,
//       pagination: {
//         total,
//         page: parseInt(page),
//         limit: parseInt(limit),
//         pages: Math.ceil(total / limit)
//       }
//     });

//   } catch (error) {
//     console.error('Get all orders error:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to retrieve orders',
//       error: error.message
//     });
//   }
// };
export const getAllOrders = async (req, res) => {
  try {
    const { status, paymentMethod, limit = 10, page = 1, sort = 'latest' } = req.query;

    const query = {};
    
    // Existing status filter
    if (status) {
      query.status = status === 'ongoing'
        ? { $in: [ORDER_STATUS.PENDING, ORDER_STATUS.CONFIRMED, ORDER_STATUS.PREPARING, ORDER_STATUS.OUT_FOR_DELIVERY] }
        : status === 'previous'
          ? { $in: [ORDER_STATUS.DELIVERED, ORDER_STATUS.CANCELLED] }
          : status;
    }

    // ADD THIS NEW PAYMENT METHOD FILTER
    if (paymentMethod) {
      query.paymentMethod = paymentMethod;
    }

    const sortOptions = {
      latest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      highest: { totalAmount: -1 },
      lowest: { totalAmount: 1 },
      payment_latest: { createdAt: -1 },
      payment_oldest: { createdAt: 1 },
      amount_high: { totalAmount: -1 },
      amount_low: { totalAmount: 1 }
    }[sort] || { createdAt: -1 };

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('user', 'name email phoneNumber')
        .sort(sortOptions)
        .skip((page - 1) * limit)
        .limit(parseInt(limit)),
      Order.countDocuments(query)
    ]);

    return res.status(200).json({
      success: true,
      orders,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get all orders error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve orders',
      error: error.message
    });
  }
};

// Payment status webhook handler
export const updatePaymentStatus = async (req, res) => {
  try {
    const { orderId, transactionId, status } = req.body;

    if (!orderId || !status || !Object.values(PAYMENT_STATUS).includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request data'
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    order.paymentStatus = status;

    if (status === PAYMENT_STATUS.COMPLETED) {
      order.paymentDetails = {
        transactionId,
        paidAmount: order.totalAmount,
        paidAt: new Date()
      };

      if (order.status === ORDER_STATUS.PENDING) {
        await order.updateStatus(ORDER_STATUS.CONFIRMED, 'Payment completed');
      }
    }

    await order.save();

    return res.status(200).json({
      success: true,
      message: 'Payment status updated'
    });

  } catch (error) {
    console.error('Payment status update error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update payment',
      error: error.message
    });
  }
};

export const updateOrderPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { paymentStatus, note } = req.body;

    // Validate payment status
    const validPaymentStatuses = ['pending', 'completed', 'refunded', 'failed'];
    if (!validPaymentStatuses.includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment status'
      });
    }

    // Find the order by ID
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Update the payment status
    order.paymentStatus = paymentStatus;

    // Add a note to the status history (not orderHistory)
    if (note) {
      order.statusHistory.push({
        status: order.status,
        note: `Payment status updated to ${paymentStatus}: ${note}`
      });
    }

    // Save the updated order
    await order.save();

    return res.status(200).json({
      success: true,
      message: `Payment status updated to ${paymentStatus}`,
      order
    });
  } catch (error) {
    console.error('Error updating payment status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update payment status'
    });
  }
};