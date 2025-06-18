import express from 'express';
import { 
    addToCart, 
    removeFromCart, 
    getCart, 
    clearCart, 
    updateCartItem,
    mergeCart
} from '../controllers/cartController.js';
import userAuth from '../middleware/userAuth.js';

const cartRouter = express.Router();

cartRouter.post('/add', userAuth, addToCart);
cartRouter.post('/remove', userAuth, removeFromCart);
cartRouter.get('/', userAuth, getCart);
cartRouter.delete('/clear', userAuth, clearCart);
cartRouter.put('/update', userAuth, updateCartItem);
cartRouter.post('/merge', userAuth, mergeCart);

export default cartRouter;