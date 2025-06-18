import jwt from 'jsonwebtoken';
import userModel from '../models/userModel.js'; 

export const isAdmin = async (req, res, next) => {
    try {
        // Extract the token from cookies
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ success: false, message: "Unauthorized." });
        }

        // Verify the token
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ success: false, message: "Token expired." });
            }
            if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({ success: false, message: "Invalid token." });
            }
            throw error; // Re-throw other errors
        }

        // Find the user in the database
        const user = await userModel.findById(decoded.id);
        if (!user || user.role !== 'admin') {
            return res.status(403).json({ success: false, message: "Access denied. Admin only." });
        }

        // Attach the user object to the request
        req.user = user; 
        next();
    } catch (error) {
        console.error("Error in isAdmin middleware:", error);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};