// controllers/authController.js
import logger from '../config/logger.js';
import { createUser } from '../models/userModel.js';

export const renderRegister = (req, res) => {
  res.render('register');
};

export const registerUser = async (req, res) => {
  try {
    const { username, password } = req.body;
    const userId = await createUser(username, password);
    req.flash('success_msg', 'You are now registered and can log in');
    res.redirect('/auth/login');
  } catch (error) {
    logger.error(error);
    req.flash('error_msg', 'Something went wrong. Please try again.');
    res.redirect('/auth/register');
  }
};

export const renderLogin = (req, res) => {
  res.render('login');
};

export const logoutUser = (req, res, next) => {
  req.logout(function(err) {
    if (err) { return next(err); }
    req.flash('success_msg', 'You are logged out');
    res.redirect('/auth/login');
  });
};
