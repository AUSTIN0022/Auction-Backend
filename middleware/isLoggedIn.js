import jwt from 'jsonwebtoken';
import { User } from '../model/DBModel.js';

export const isLoggedIn = async (req, res, next) => {
  try {
    // token in headers or cookies
    const token = req.headers.authorization?.split(' ')[1] || req.cookies?.authToken;
    
    if (!token) {
      
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(401).json({ 
          success: false, 
          message: "Authentication required" 
        });
      }
      
      return res.redirect('/error?type=unauthorized&message=Please log in to access this page');
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user
    const user = await User.findById(decoded.userId);
    if (!user) {
      
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(401).json({ 
          success: false, 
          message: "User not found" 
        });
      }
    
      return res.redirect('/error?type=unauthorized&message=User account not found');
    }
    
    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid or expired token" 
      });
    }
    
    return res.redirect('/error?type=unauthorized&message=Your session has expired. Please log in again');
  }
};