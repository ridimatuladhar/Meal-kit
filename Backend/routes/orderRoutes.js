import express from 'express';
import userAuth from '../middleware/userAuth.js';
import {
  createOrder,
  getUserOrders,
  getOrderById,
  cancelOrder,
  updateOrderStatus,
  getAllOrders,
  updatePaymentStatus,
  createOrderKhalti,
  verifyKhaltiPayment,
  updateOrderPaymentStatus
} from '../controllers/orderController.js';
import { isAdmin } from '../middleware/adminAuth.js';

const orderRouter = express.Router();

// User routes
orderRouter.post('/', userAuth, createOrder);
orderRouter.get('/my-orders', userAuth, getUserOrders);
orderRouter.get('/:orderId', userAuth, getOrderById);
orderRouter.post('/:orderId/cancel', userAuth, cancelOrder);

// Khalti payment routes
orderRouter.post('/khalti/create', userAuth, createOrderKhalti);
orderRouter.post('/khalti/verify', userAuth, verifyKhaltiPayment);

// Admin routes
orderRouter.get('/admin/all', isAdmin , getAllOrders); // adminAuth will be checked inside the controller
orderRouter.put('/admin/:orderId/status', isAdmin, updateOrderStatus); // adminAuth will be checked inside the controller
orderRouter.put('/admin/:orderId/payment-status', isAdmin, updateOrderPaymentStatus);
orderRouter.post('/payment-webhook', updatePaymentStatus);

export default orderRouter;