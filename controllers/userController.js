import { getAllUsers, deleteUser, findUserById } from '../models/userModel.js';

export const listUsers = async (req, res) => {
    try {
        const users = await getAllUsers();
        res.render('users', { users, currentUser: req.user });
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'Erreur lors de la récupération des utilisateurs');
        res.redirect('/dashboard');
    }
};

export const deleteUserById = async (req, res) => {
    try {
        const userIdToDelete = req.params.id;
        const requester = req.user;

        // Check if user exists
        const userToDelete = await findUserById(userIdToDelete);
        if (!userToDelete) {
            req.flash('error_msg', 'Utilisateur introuvable');
            return res.redirect('/users');
        }

        // Hierarchy and Safety Checks
        
        // 1. Prevent deleting self
        if (requester.id == userIdToDelete) {
             req.flash('error_msg', 'Vous ne pouvez pas vous supprimer vous-même.');
             return res.redirect('/users');
        }

        // 2. Role Hierarchy Check
        // Only Admins can delete users. (This should also be protected by route middleware)
        if (requester.role !== 'admin') {
            req.flash('error_msg', 'Action non autorisée.');
            return res.redirect('/users');
        }

        // 3. Strict Hierarchy: Can an Admin delete another Admin?
        // If we interpret "check hierarchy" strictly, maybe not.
        // But typically, yes. 
        // Let's enforce that Admin cannot delete another Admin to be safe/strict if that's what "hierarchy" implies,
        // OR assume Admin > User and Admin = Admin.
        // Given the prompt, let's implement a check: 
        // If target is Admin, ask for confirmation? The popup handles confirmation.
        // Let's assume Admin CAN delete Admin.

        await deleteUser(userIdToDelete);
        req.flash('success_msg', 'Utilisateur supprimé avec succès');
        res.redirect('/users');
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'Erreur lors de la suppression');
        res.redirect('/users');
    }
};
