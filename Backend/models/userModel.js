import mongoose from "mongoose";


const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phoneNumber: { type: String, required: true, unique: true },
    address: { type: String, required: true },

    role: { type: String, enum: ['customer', 'admin'], default: 'customer' }, 

    verifyOtp: { type: String, default: '' },
    verifyOtpExpireAt: { type: Number, default: 0 },

    isAccountVerified: { type: Boolean, default: false },
    
    resetOtp: { type: String, default: '' },
    resetOtpExpireAt: { type: Number, default: 0 },
    profilePicture: {type: String, default: ''
    },
    
    favorites: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'MealKit'
        }
    ],
    cart: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'MealKit'
        }
    ]
});


const userModel = mongoose.models.user || mongoose.model('user', userSchema);

export default userModel