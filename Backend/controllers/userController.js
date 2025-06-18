import userModel from "../models/userModel.js";

export const getUserData = async (req, res) => {
  try {
    const { userId } = req.body;

    // Find the user by ID
    const user = await userModel.findById(userId);

    // If user not found, return an error
    if (!user) {
      return res.json({ success: false, message: "User not found." });
    }

    // Return user data
    res.json({ 
      success: true, 
      userData: { user },
    });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

export const updateUserField = async (req, res) => {
  try {
    // Get userId from req.body (set by the userAuth middleware)
    const { userId } = req.body;
    
    if (!userId) {
      return res.json({ 
        success: false, 
        message: "Authentication failed. Please login again." 
      });
    }
    
    // Get the field to update from request body (excluding userId)
    const updateData = { ...req.body };
    delete updateData.userId;
    
    // Validate that we have something to update
    if (Object.keys(updateData).length === 0) {
      return res.json({ 
        success: false, 
        message: "No fields provided for update" 
      });
    }
    
    // List of allowed fields that can be updated
    const allowedFields = ['name', 'email', 'phoneNumber', 'address'];
    
    // Filter out any fields that are not allowed to be updated
    const filteredUpdateData = {};
    let hasValidField = false;
    
    for (const field of allowedFields) {
      if (field in updateData) {
        filteredUpdateData[field] = updateData[field];
        hasValidField = true;
      }
    }
    
    // Check if any valid fields were provided
    if (!hasValidField) {
      return res.json({ 
        success: false, 
        message: "No valid fields provided for update" 
      });
    }
    
    // Special validation for email (if it's being updated)
    if ('email' in filteredUpdateData) {
      // Check if email is valid
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(filteredUpdateData.email)) {
        return res.json({ 
          success: false, 
          message: "Invalid email format" 
        });
      }
      
      // Check if email is already taken by another user
      const existingUser = await userModel.findOne({ 
        email: filteredUpdateData.email,
        _id: { $ne: userId } // exclude current user
      });
      
      if (existingUser) {
        return res.json({ 
          success: false, 
          message: "Email already in use by another account" 
        });
      }
    }
    
    // Update the user with the filtered data
    const updatedUser = await userModel.findByIdAndUpdate(
      userId,
      { $set: filteredUpdateData },
      { new: true } // return updated document
    );
    
    // If user not found, return an error
    if (!updatedUser) {
      return res.json({ 
        success: false, 
        message: "User not found or update failed" 
      });
    }
    
    // Return success response
    return res.json({
      success: true,
      message: "Field updated successfully",
      updatedField: Object.keys(filteredUpdateData)[0]
    });
    
  } catch (error) {
    console.error("Error updating user field:", error);
    return res.json({ 
      success: false, 
      message: error.message || "An error occurred while updating the field" 
    });
  }
};

export const getAllUsers = async (req, res) => {
    try {
      const users = await userModel.find({}); // Fetch all users
      res.json({ success: true, users });
    } catch (error) {
      res.json({ success: false, message: error.message });
    }
  };

// Delete a user
export const deleteUser = async (req, res) => {
    try {
      const { userId } = req.body;
  
      // Find and delete the user
      const deletedUser = await userModel.findByIdAndDelete(userId);
  
      // If user not found, return an error
      if (!deletedUser) {
        return res.json({ success: false, message: "User not found." });
      }
  
      res.json({ success: true, message: "User deleted successfully." });
    } catch (error) {
      res.json({ success: false, message: error.message });
    }
  };

// Count total number of users
// export const countUsers = async (req, res) => {
//     try {
//       const userCount = await userModel.countDocuments({});
//       res.json({ success: true, userCount });
//     } catch (error) {
//       res.json({ success: false, message: error.message });
//     }
//   };