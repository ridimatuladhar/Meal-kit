import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import userModel from '../models/userModel.js';
import transporter from '../config/nodemailer.js';

//  export const login = async (req, res) => {
//     const { email, password } = req.body;
//     if (!email || !password) {
//         return res.status(400).json({ success: false, message: 'Email and password are required' });
//     }
//     try {
//         const user = await userModel.findOne({ email });
//         if (!user) {
//             return res.status(401).json({ success: false, message: 'Invalid email.' });
//         }

//         const isMatch = await bcrypt.compare(password, user.password);
//         if (!isMatch) {
//             return res.status(401).json({ success: false, message: 'Invalid password.' });
//         }

//         const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '2d' });
//         res.cookie('token', token, {
//             httpOnly: true,
//             secure: process.env.NODE_ENV === 'production',
//             sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
//             maxAge: 7 * 24 * 60 * 60 * 1000
//         });

//         return res.status(200).json({ success: true }); 
//     } catch (error) {
//         return res.status(500).json({ success: false, message: error.message });
//     }
// };

// export const register = async (req, res) => {
//     const { name, email, phoneNumber, address, password, role } = req.body;

//     // Validate required fields
//     if (!name || !email || !password || !phoneNumber || !address) {
//         return res.json({ success: false, message: 'Missing details' });
//     }

//     try {
//         // Check if user already exists
//         const existingUser = await userModel.findOne({ email });
//         if (existingUser) {
//             return res.json({ success: false, message: "User already exists." });
//         }

//         // Hash the password
//         const hashedPassword = await bcrypt.hash(password, 10);

//         // Create a new user with the provided role (or default to 'customer')
//         const user = new userModel({
//             name,
//             email,
//             phoneNumber,
//             address,
//             password: hashedPassword,
//             role: role || 'customer', // Use provided role or default to 'customer'
//         });

//         // Save the user to the database
//         await user.save();

//         // Generate a JWT token
//         const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '2d' });

//         // Set the token in a cookie
//         // res.cookie('token', token, {
//         //     httpOnly: true,
//         //     secure: process.env.NODE_ENV === 'production',
//         //     sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
//         //     maxAge: 7 * 24 * 60 * 60 * 1000,
//         // });

//         res.cookie('token', token, {
//             httpOnly: true,
//             secure: process.env.NODE_ENV === 'production',
//             sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
//             maxAge: 7 * 24 * 60 * 60 * 1000,
//             domain: 'localhost', 
//             path: '/', 
//           });
//         // Send a welcome email
//         const mailOptions = {
//             from: process.env.SENDER_EMAIL,
//             to: email,
//             subject: 'Welcome to Easy-Khana',
//             text: `Welcome to Easy-Khana. Your account has been created with email id: ${email}`,
//         };

//         await transporter.sendMail(mailOptions);

//         // Return success response
//         res.status(200).json({
//             success: true,
//             token, 
//             message: "Registration successful.",
//           });
//     } catch (error) {
//         return res.json({ success: false, message: error.message });
//     }
// };

// export const login = async (req, res) => {
//     const { email, password } = req.body;

//     // Validate required fields
//     if (!email || !password) {
//         return res.status(400).json({ 
//             success: false, 
//             message: 'Email and password are required',
//             field: !email ? 'email' : 'password' // Indicate which field is missing
//         });
//     }

//     // try {
//     //     // Find the user by email
//     //     const user = await userModel.findOne({ email });
//     //     if (!user) {
//     //         return res.status(401).json({ success: false, message: 'Invalid email.' });
//     //     }
//     try {
//         // Case-insensitive email search and explicit projection
//         const user = await userModel.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } })
//                                    .select('+password'); 

//         // Compare the provided password with the hashed password
//         const isMatch = await bcrypt.compare(password, user.password);
//         if (!isMatch) {
//             return res.status(401).json({ success: false, message: 'Invalid password.' });
//         }

//         // Generate a JWT token with the user's role
//         const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '2d' });

//         // Set the token in a cookie
//         // res.cookie('token', token, {
//         //     httpOnly: true,
//         //     secure: process.env.NODE_ENV === 'production',
//         //     sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
//         //     maxAge: 7 * 24 * 60 * 60 * 1000,
//         // });

//         res.cookie('token', token, {
//             httpOnly: true,
//             secure: process.env.NODE_ENV === 'production',
//             sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
//             maxAge: 7 * 24 * 60 * 60 * 1000,
//             domain: 'localhost', // Ensure this matches the frontend domain
//             path: '/', // Ensure the cookie is accessible across the entire site
//           });

//         // Return success response with the user's role
//         return res.status(200).json({
//             success: true,
//             token, 
//             role: user.role,
//             message: "Login successful.",
//           });
//     } catch (error) {
//         return res.status(500).json({ success: false, message: error.message });
//     }
// };
export const register = async (req, res) => {
    const { name, email, phoneNumber, address, password, role } = req.body;

    // Validate required fields
    if (!name || !email || !password || !phoneNumber || !address) {
        return res.status(400).json({ 
            success: false, 
            message: 'All fields are required' 
        });
    }

    // Validate email format
    if (!/^\S+@\S+\.\S+$/.test(email)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid email format'
        });
    }

    // Validate password length (minimum 8 characters)
    if (password.length < 8) {
        return res.status(400).json({
            success: false,
            message: 'Password must be at least 8 characters long'
        });
    }

    // Validate phone number (exactly 10 digits)
    if (!/^\d{10}$/.test(phoneNumber)) {
        return res.status(400).json({
            success: false,
            message: 'Phone number must be exactly 10 digits'
        });
    }

    try {
        const existingUser = await userModel.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } });
        if (existingUser) {
            return res.status(409).json({ 
                success: false, 
                message: "User already exists" 
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new userModel({
            name,
            email: email.toLowerCase(),
            phoneNumber,
            address,
            password: hashedPassword,
            role: role || 'customer',
        });

        await user.save();

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '2d' });

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge: 2 * 24 * 60 * 60 * 1000, // 2 days
            domain: 'localhost', 
          path: '/',
        });

        // Send welcome email
        await transporter.sendMail({
            from: process.env.SENDER_EMAIL,
            to: email,
            subject: 'Welcome to Easy-Khana',
            text: `Welcome to Easy-Khana. Your account has been created with email id: ${email}`,
        });

        return res.status(201).json({
            success: true,
            token,
            message: "Registration successful",
            userId: user._id
        });
    } catch (error) {
        console.error('Registration error:', error);
        return res.status(500).json({ 
            success: false, 
            message: "Internal server error" 
        });
    }
};

export const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ 
            success: false, 
            message: 'Email and password are required'
        });
    }

    try {
        const user = await userModel.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } })
                                   .select('+password');

        if (!user) {
            return res.status(200).json({ 
                success: false, 
                message: 'Invalid credentials' 
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(200).json({ 
                success: false, 
                message: 'Invalid credentials' 
            });
        }

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '2d' });

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge: 2 * 24 * 60 * 60 * 1000, // 2 days
            domain: 'localhost', 
            path: '/',
        });

        return res.status(200).json({
            success: true,
            token,
            role: user.role,
            message: "Login successful",
            userId: user._id
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ 
            success: false, 
            message: "Internal server error" 
        });
    }
};

export const logout = async (req, res) => {
    try {
        res.clearCookie('token', {
            httpOnly:true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        })
        return res.json({success: true, message: "Logged Out"})
    } catch (error) {
        return res.json({success: false, message: error.message})
    }
}

//Sending Verification OTP to user email
export const sendVerifyOtp = async (req, res) => {
    try {
        const {userId} = req.body;
        const user = await userModel.findById(userId);
        if(user.isAccountVerified){
            return res.json({success: false, message: "Account is already verified."})
        }
        const otp = String(Math.floor(100000 + Math.random()* 900000));

        user.verifyOtp = otp;
        user.verifyOtpExpireAt = Date.now() + 24 * 60 * 60 * 1000;

        await user.save();

        const mailOptions = {
            from : process.env.SENDER_EMAIL,
            to: user.email,
            subject: 'Account verification OTP',
            text: `Your OTP is ${otp}. Verify your account using this OTP.`
        }
        await transporter.sendMail(mailOptions);

        return res.json({success: true, message: "Verification OTP sent on the email."})
    } catch (error) {
        return res.json({success: false, message: error.message})
    }
}

export const verifyEmail = async (req,res) => {
    const {userId, otp} = req.body;
    if(!userId || !otp) {
        return res.json({success: false, message: "Missing Details"});
    }
    try {
        const user = await userModel.findById(userId);
        if(!user){
            return res.json({success: false, message: "User not found."})
        }        
        if(user.verifyOtp === '' || user.verifyOtp !==otp){
            return res.json({success: false, message: "Invalid OTP."})
        }
        if(user.verifyOtpExpireAt < Date.now()){
            return res.json({success: false, message: "OTP Expired."})
        }
        user.isAccountVerified = true;
        user.verifyOtp = '';
        user.verifyOtpExpireAt = 0;

        await user.save();
        return res.json({success: true, message: "Email verified successfully."})
    } catch (error) {
        return res.json({success: false, message: error.message})
    }
}

//check if user is authenticated
export const isAuthenticated = async (req, res) => {
    try {
        return res.json({success: true})
    } catch (error) {
        return res.json({success: false, message: error.message})
    }
}

export const sendResetOtp = async (req, res) => {
    const {email} = req.body;
     if (!email){
        return res.json({success: false, message: "Email required."});
     }
     try {
        const user = await userModel.findOne({email});
        if(!user){
            return res.json({success: false, message: "User not found"});
        }

        const otp = String(Math.floor(100000 + Math.random()* 900000));

        user.resetOtp = otp;
        user.resetOtpExpireAt = Date.now() + 15 * 60 * 1000;

        await user.save();

        const mailOptions = {
            from : process.env.SENDER_EMAIL,
            to: user.email,
            subject: 'Password reset OTP',
            text: `Your OTP for reseting your password is ${otp}.`
        }
        await transporter.sendMail(mailOptions);
        return res.json({success: true, message: "OTP sent to your email."});

     } catch (error) {
        return res.json({success: false, message: error.message});
     }
}

//Reset password
export const resetPassword = async (req, res) => {
    const {email, otp, newPassword} = req.body;
    if(!email || !otp || !newPassword){
        return res.json({success: false, message: "Email, OTP and new password are required"});
    }   
    try {
        const user = await userModel.findOne({email});
        if(!user){
            return res.json({success: false, message: "User not found."});
        }        
        if(user.resetOtp ==="" || user.resetOtp !== otp){
            return res.json({success: false, message: "Invalid OTP."});
        }
        if(user.resetOtpExpireAt < Date.now()){
            return res.json({success: false, message: "OTP Expired"});
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password =  hashedPassword;
        user.resetOtp = "";
        user.resetOtpExpireAt = 0;

        await user.save();
        return res.json({success: true, message: "Password has been reset successfully."});
    } catch (error) {
        return res.json({success: false, message: error.message});
    }
}