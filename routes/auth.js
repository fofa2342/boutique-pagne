// routes/auth.js
import express from 'express';
import passport from 'passport';
import {
  renderRegister,
  registerUser,
  renderLogin,
  logoutUser,
} from '../controllers/authController.js';

const router = express.Router();

router.get('/register', renderRegister);
router.post('/register', registerUser);
router.get('/login', renderLogin);
router.post(
  '/login',
  passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/auth/login',
  })
);
router.get('/logout', logoutUser);

export default router;
