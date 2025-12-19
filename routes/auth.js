// routes/auth.js
import express from 'express';
import passport from 'passport';
import {
  renderRegister,
  registerUser,
  renderLogin,
  logoutUser,
} from '../controllers/authController.js';
import { validateUserRegistration, validateLogin } from '../middleware/validators.js';

const router = express.Router();

router.get('/register', renderRegister);
router.post('/register', validateUserRegistration, registerUser);
router.get('/login', renderLogin);
router.post(
  '/login',
  validateLogin,
  passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/auth/login',
    failureFlash: true,
  })
);
router.get('/logout', logoutUser);

export default router;
