// controllers/adminController.js
import { getAllUsers, updateUserStatus, updateUserRole, findUserById } from '../models/userModel.js';

export const renderUserManagement = async (req, res) => {
  try {
    const users = await getAllUsers();
    res.render('admin/users', { users, layout: 'layout' });
  } catch (error) {
    console.error(error);
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
        console.error(error);
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
        console.error(error);
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
        console.error(error);
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
        console.error(error);
        req.flash('error_msg', 'Failed to demote user.');
        res.redirect('/admin/users');
    }
};
