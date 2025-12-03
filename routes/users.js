import express from 'express';
import { listUsers, deleteUserById } from '../controllers/userController.js';

const router = express.Router();

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
    if (req.isAuthenticated() && req.user.role === 'admin') {
        return next();
    }
    req.flash('error_msg', 'Accès non autorisé. Rôle administrateur requis.');
    res.redirect('/dashboard');
};

// Apply isAdmin to all routes in this router
router.use(isAdmin);

// List users
router.get('/', listUsers);

// Delete user
router.delete('/delete/:id', deleteUserById);

export default router;
