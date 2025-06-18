import userModel from '../models/userModel.js';
import { MealKit } from '../models/mealKitModel.js';
import { Cart } from '../models/cartModel.js';
import mongoose from 'mongoose';


export const addToCart = async (req, res) => {
    try {
        const { userId, mealKitId, quantity = 1 } = req.body;

        // Validate inputs
        if (!userId || !mealKitId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid request parameters' 
            });
        }

        // Fetch the meal kit to verify it exists
        const mealKit = await MealKit.findById(mealKitId);
        if (!mealKit) {
            return res.status(404).json({ 
                success: false, 
                message: 'Meal kit not found' 
            });
        }

        // Find the user
        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        // Add meal kit to user's cart array if not already there
        if (!user.cart.includes(mealKitId)) {
            user.cart.push(mealKitId);
            await user.save();
        }

        // Get user cart with populated meal kit details
        const populatedUser = await userModel.findById(userId)
            .populate('cart');
            
        res.status(200).json({ 
            success: true, 
            message: 'Added to cart', 
            cart: populatedUser.cart 
        });
    } catch (error) {
        console.error('Add to cart error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error adding to cart',
            error: error.message 
        });
    }
};


export const removeFromCart = async (req, res) => {
    try {
        const { mealKitId } = req.body;
        const userId = req.body.userId; // From your userAuth middleware

        // Validate inputs
        if (!mealKitId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Missing meal kit ID'
            });
        }

        // Find the user's cart
        const cart = await Cart.findOne({ user: userId });
        
        if (!cart) {
            return res.status(404).json({ 
                success: false, 
                message: 'Cart not found'
            });
        }

        // Check if the meal kit exists in the cart
        const itemIndex = cart.items.findIndex(item => 
            item.mealKit.toString() === mealKitId
        );

        if (itemIndex === -1) {
            return res.status(404).json({ 
                success: false, 
                message: 'Item not found in cart'
            });
        }

        // Remove the item
        cart.items.splice(itemIndex, 1);
        await cart.save();
        
        // Get updated cart with populated data
        const updatedCart = await Cart.findOne({ user: userId })
            .populate('items.mealKit');
            
        // Format the response to match frontend expectations
        const formattedCart = updatedCart.items.map(item => ({
            id: item.mealKit._id,
            title: item.mealKit.title,
            price: item.mealKit.price,
            image: item.mealKit.image,
            quantity: item.quantity
        }));
            
        res.status(200).json({ 
            success: true, 
            message: 'Item removed from cart', 
            cart: formattedCart
        });
    } catch (error) {
        console.error('Remove from cart error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error removing from cart',
            error: error.message 
        });
    }
};


// export const getCart = async (req, res) => {
//     try {
//         const { userId } = req.body;

//         // Find the user and populate cart with meal kit details
//         const user = await userModel.findById(userId)
//             .populate('cart');

//         if (!user) {
//             return res.status(404).json({ 
//                 success: false, 
//                 message: 'User not found' 
//             });
//         }

//         res.status(200).json({ 
//             success: true, 
//             cart: user.cart 
//         });
//     } catch (error) {
//         console.error('Get cart error:', error);
//         res.status(500).json({ 
//             success: false, 
//             message: 'Error fetching cart',
//             error: error.message 
//         });
//     }
// };

export const getCart = async (req, res) => {
    try {
        const userId = req.body.userId;
        
        // Find the user's cart
        let cart = await Cart.findOne({ user: userId })
            .populate('items.mealKit');
        
        // If no cart exists yet, create one
        if (!cart) {
            cart = new Cart({ user: userId, items: [] });
            await cart.save();
        }
        
        // Check if there's a local cart in the request
        const localCart = req.body.localCart || [];
        
        // If local cart exists, merge items that don't exist in server cart
        if (localCart.length > 0) {
            let updated = false;
            
            // Process each local cart item
            for (const localItem of localCart) {
                // Check if item already exists in server cart
                const existingItemIndex = cart.items.findIndex(
                    item => item.mealKit._id.toString() === localItem.id
                );
                
                if (existingItemIndex === -1) {
                    // Item doesn't exist in server cart, add it
                    try {
                        // Verify meal kit exists
                        const mealKit = await MealKit.findById(localItem.id);
                        if (mealKit) {
                            cart.items.push({
                                mealKit: localItem.id,
                                quantity: localItem.quantity || 1
                            });
                            updated = true;
                        }
                    } catch (err) {
                        console.error(`Error adding local item ${localItem.id} to cart:`, err);
                    }
                }
            }
            
            // Save if cart was updated
            if (updated) {
                await cart.save();
                // Refresh with populated data
                cart = await Cart.findOne({ user: userId }).populate('items.mealKit');
            }
        }
        
        // Format the response
        const formattedCart = cart.items.map(item => ({
            id: item.mealKit._id,
            title: item.mealKit.title,
            price: item.mealKit.price,
            image: item.mealKit.image,
            quantity: item.quantity
        }));
        
        res.status(200).json({ 
            success: true, 
            cart: formattedCart
        });
    } catch (error) {
        console.error('Get cart error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching cart',
            error: error.message 
        });
    }
};

export const mergeCart = async (req, res) => {
    try {
        const userId = req.body.userId;
        const localCart = req.body.items || [];
        
        if (localCart.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'No items to merge',
                cart: []
            });
        }
        
        // Find or create user's cart
        let cart = await Cart.findOne({ user: userId });
        if (!cart) {
            cart = new Cart({ user: userId, items: [] });
        }
        
        // Track if any changes were made
        let updated = false;
        
        // Process each local cart item
        for (const localItem of localCart) {
            if (!localItem.id) continue;
            
            // Check if item already exists in server cart
            const existingItemIndex = cart.items.findIndex(
                item => item.mealKit.toString() === localItem.id
            );
            
            if (existingItemIndex === -1) {
                // Item doesn't exist in server cart, add it
                cart.items.push({
                    mealKit: localItem.id,
                    quantity: localItem.quantity || 1
                });
                updated = true;
            } else {
                // Item exists, update quantity if necessary
                const serverQuantity = cart.items[existingItemIndex].quantity;
                const localQuantity = localItem.quantity || 1;
                
                if (serverQuantity !== localQuantity) {
                    cart.items[existingItemIndex].quantity = Math.max(serverQuantity, localQuantity);
                    updated = true;
                }
            }
        }
        
        // Save if cart was updated
        if (updated) {
            await cart.save();
        }
        
        // Get updated cart with populated data
        const updatedCart = await Cart.findOne({ user: userId }).populate('items.mealKit');
        
        // Format the response
        const formattedCart = updatedCart.items.map(item => ({
            id: item.mealKit._id,
            title: item.mealKit.title,
            price: item.mealKit.price,
            image: item.mealKit.image,
            quantity: item.quantity
        }));
        
        res.status(200).json({
            success: true,
            message: 'Cart merged successfully',
            cart: formattedCart
        });
    } catch (error) {
        console.error('Merge cart error:', error);
        res.status(500).json({
            success: false,
            message: 'Error merging cart',
            error: error.message
        });
    }
};

export const updateCartItem = async (req, res) => {
    try {
        const { mealKitId, quantity } = req.body;
        const userId = req.body.userId; // From your userAuth middleware

        // Validate inputs
        if (!mongoose.Types.ObjectId.isValid(mealKitId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid meal kit ID format"
            });
        }

        if (!Number.isInteger(quantity) || quantity < 1 || quantity > 7) {
            return res.status(400).json({
                success: false,
                message: "Quantity must be between 1 and 7"
            });
        }

        // Find or create cart
        let cart = await Cart.findOneAndUpdate(
            { user: userId },
            {},
            { upsert: true, new: true, setDefaultsOnInsert: true }
        ).populate('items.mealKit');

        // Find the item index
        const itemIndex = cart.items.findIndex(item => 
            item.mealKit._id.toString() === mealKitId
        );

        if (itemIndex === -1) {
            // Verify meal kit exists
            const mealKit = await MealKit.findById(mealKitId);
            if (!mealKit) {
                return res.status(404).json({
                    success: false,
                    message: "Meal kit not found"
                });
            }

            // Add new item
            cart.items.push({
                mealKit: mealKitId,
                quantity: quantity
            });
        } else {
            // Update existing item
            cart.items[itemIndex].quantity = quantity;
        }

        await cart.save();

        return res.json({
            success: true,
            message: "Cart updated successfully",
            cart
        });

    } catch (error) {
        console.error("Error updating cart item:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};


export const clearCart = async (req, res) => {
    try {
        const { userId } = req.body;

        // Find the user's cart
        const cart = await Cart.findOne({ user: userId });
        
        if (!cart) {
            return res.status(404).json({ 
                success: false, 
                message: 'Cart not found' 
            });
        }

        // Clear the items array
        cart.items = [];
        await cart.save();

        res.status(200).json({ 
            success: true, 
            message: 'Cart cleared successfully' 
        });
    } catch (error) {
        console.error('Clear cart error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error clearing cart',
            error: error.message 
        });
    }
};