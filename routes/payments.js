const express = require('express');
const router = express.Router();

const UserController = require('../controllers/user');
const PaymentController = require('../controllers/payment');

// http://localhost:3001/api/v1/payments
router.get('', UserController.authMiddleware, PaymentController.getPendingPayments);

// http://localhost:3001/api/v1/payments/accept
router.post('/accept', UserController.authMiddleware, PaymentController.confirmPayment);

// http://localhost:3001/api/v1/payments/decline
router.post('/decline', UserController.authMiddleware, PaymentController.declinePayment);

module.exports = router;
