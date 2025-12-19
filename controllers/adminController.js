// controllers/adminController.js
import logger from '../config/logger.js';
import { getAllUsers, updateUserStatus, updateUserRole, findUserById, deleteUser as deleteUserModel } from '../models/userModel.js';

export const renderUserManagement = async (req, res) => {
  try {
    const users = await getAllUsers();
    res.render('admin/users', { users, layout: 'layout' });
  } catch (error) {
    logger.error(error);
    req.flash('error_msg', 'Could not fetch users.');
    res.redirect('/dashboard');
  }
};

export const approveUser = async (req, res) => {
    const { id } = req.params;
    try {
        const user = await findUserById(id);
        if (user && user.role === 'superadmin') {
            req.flash('error_msg', 'Cannot modify Superadmin.');
            return res.redirect('/admin/users');
        }

        await updateUserStatus(id, 'active');
        req.flash('success_msg', 'User has been approved.');
        res.redirect('/admin/users');
    } catch (error) {
        logger.error(error);
        req.flash('error_msg', 'Failed to approve user.');
        res.redirect('/admin/users');
    }
};

export const suspendUser = async (req, res) => {
    const { id } = req.params;
    try {
        const user = await findUserById(id);
        if (user && user.role === 'superadmin') {
            req.flash('error_msg', 'Cannot modify Superadmin.');
            return res.redirect('/admin/users');
        }

        await updateUserStatus(id, 'inactive');
        req.flash('success_msg', 'User has been suspended.');
        res.redirect('/admin/users');
    } catch (error) {
        logger.error(error);
        req.flash('error_msg', 'Failed to suspend user.');
        res.redirect('/admin/users');
    }
};

export const promoteUser = async (req, res) => {
    const { id } = req.params;
    try {
        const user = await findUserById(id);
        if (user && user.role === 'superadmin') {
            req.flash('error_msg', 'Cannot modify Superadmin.');
            return res.redirect('/admin/users');
        }

        await updateUserRole(id, 'admin');
        req.flash('success_msg', 'User has been promoted to Admin.');
        res.redirect('/admin/users');
    } catch (error) {
        logger.error(error);
        req.flash('error_msg', 'Failed to promote user.');
        res.redirect('/admin/users');
    }
};

export const demoteUser = async (req, res) => {
    const { id } = req.params;
    try {
        const user = await findUserById(id);
        if (user && user.role === 'superadmin') {
            req.flash('error_msg', 'Cannot modify Superadmin.');
            return res.redirect('/admin/users');
        }

        await updateUserRole(id, 'user');
        req.flash('success_msg', 'User has been demoted to User.');
        res.redirect('/admin/users');
    } catch (error) {
        logger.error(error);
        req.flash('error_msg', 'Failed to demote user.');
        res.redirect('/admin/users');
    }
};

export const deleteUser = async (req, res) => {
    const { id } = req.params;
    try {
        const userToDelete = await findUserById(id);

        if (!userToDelete) {
            req.flash('error_msg', 'User not found.');
            return res.redirect('/admin/users');
        }

        if (userToDelete.role === 'superadmin') {
            req.flash('error_msg', 'Cannot delete Superadmin.');
            return res.redirect('/admin/users');
        }

        if (req.user.id == id) {
             req.flash('error_msg', 'You cannot delete your own account.');
             return res.redirect('/admin/users');
        }

        if (userToDelete.role === 'admin' && req.user.role !== 'superadmin') {
            req.flash('error_msg', 'Only Superadmin can delete Administrators.');
            return res.redirect('/admin/users');
        }

        await deleteUserModel(id);
        req.flash('success_msg', 'User deleted successfully.');
        res.redirect('/admin/users');

    } catch (error) {
        logger.error(error);
        req.flash('error_msg', 'Failed to delete user.');
        res.redirect('/admin/users');
    }
};
