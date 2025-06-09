
export const authorizeRole = (requiredRoles) => {
  
  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
  
  return (req, res, next) => {
  
    if (!req.user) {
      return res.status(500).json({ 
        success: false, 
        message: "Server error: User not authenticated" 
      });
    }
    
    // if user has one of the required roles
    if (!roles.includes(req.user.role)) {
      
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(403).json({ 
          success: false, 
          message: "Access denied" 
        });
      }
      
      return res.redirect('/error?type=forbidden&message=You do not have permission to access this page');
    }
    
    next();
  };
};