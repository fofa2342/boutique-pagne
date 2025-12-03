// routes/admin.js
import express from 'express';
import { renderUserManagement, approveUser, suspendUser, promoteUser, demoteUser } from '../controllers/adminController.js';

const router = express.Router();

router.get('/users', renderUserManagement);
router.post('/users/:id/approve', approveUser);
router.post('/users/:id/suspend', suspendUser);
router.post('/users/:id/promote', promoteUser);
router.post('/users/:id/demote', demoteUser);


export default router;
