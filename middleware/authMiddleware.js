// middleware/authMiddleware.js

export const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    req.flash('error_msg', 'Veuillez vous connecter pour accéder à cette ressource.');
    res.redirect('/auth/login');
};

export const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.redirect('/auth/login');
        }
        // 'superadmin' role bypasses all role checks
        if (req.user.role === 'superadmin') {
            return next();
        }
        if (!roles.includes(req.user.role)) {
            req.flash('error_msg', 'Vous n\'êtes pas autorisé à accéder à cette ressource.');
            return res.status(403).redirect('/dashboard'); // Or another appropriate redirect
        }
        next();
    };
};


