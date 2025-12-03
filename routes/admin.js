// routes/admin.js
import express from 'express';
import { renderUserManagement, approveUser, suspendUser, promoteUser, demoteUser, deleteUser } from '../controllers/adminController.js';

const router = express.Router();

router.get('/users', renderUserManagement);
router.post('/users/:id/approve', approveUser);
router.post('/users/:id/suspend', suspendUser);
router.post('/users/:id/promote', promoteUser);
router.post('/users/:id/demote', demoteUser);
router.delete('/users/:id/delete', deleteUser);


export default router;
