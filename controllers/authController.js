import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../model/DBModel.js';

export const register = async (req, res) => {
  const { name, email, password, matchPassword, mobile } = req.body;
  const idProof = req.file?.path || null;

  if (!name || !email || !password || !matchPassword || !mobile) {
    return res.status(400).json({ 
        success: false, 
        message: "All fields are required" 
    });
  }

//   if (!['admin', 'user'].includes(role)) {
//     return res.status(400).json({ 
//         success: false, 
//         message: "Invalid role specified" 
//     });
//   }

  if (password !== matchPassword) {
    return res.status(400).json({ 
        success: false, 
        message: "Passwords do not match" 
    });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(409).json({ success: false, message: "Email already registered" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({ 
        name, 
        email, 
        password: hashedPassword, 
        mobile: parseInt(mobile), 
        idProof,
    });
    await newUser.save();

    const token = jwt.sign({ 
        userId: newUser._id, 
         
    }, process.env.JWT_SECRET, 
    { expiresIn: '24h' });

    res.status(201).json({
      success: true,
      message: `registered successfully.`,
      token,
      user: { id: newUser._id, name: newUser.name, email: newUser.email }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const login = async (req, res) => {
    const { email, password } = req.body;
  
    if (!email || !password) {
      return res.status(400).json({ 
          success: false, 
          message: "Email and password are required" 
      });
    }
  
    try {
      // Find user
      const user = await User.findOne({ email });
      
      if (!user) return res.status(404).json({ 
          success: false, 
          message: "User not found" 
      });
  
      if (!user.isActive) return res.status(403).json({ 
          success: false, 
          message: "Account deactivated" 
      });
  
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(401).json({ 
          success: false, 
          message: "Invalid credentials" 
      });
  
      // create JWT token
      const token = jwt.sign({ 
          userId: user._id, 
          role: user.role 
      }, process.env.JWT_SECRET, 
      { expiresIn: '24h' });
      

      res.cookie("authToken",token, { maxAge: 3600000});
  
      res.status(200).json({
        success: true,
        message: "Login successful",
        token,
        userId: user._id,
        user: { 
          id: user._id, 
          name: user.name, 
          email: user.email, 
          role: user.role 
        }
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ 
        success: false, 
        message: "An error occurred during login" 
      });
    }
};


export const logout = async (req, res) => {
    res.clearCookie('authToken', {
        httpOnly: true,
        secure: true,
        sameSite: 'None',
        path: '/'
    });
    res.json({ message: "Logout" });
}
