const express = require('express');
const router = express.Router();

const UserController = require('../controllers/user');
const BookingController = require('../controllers/booking');

// http://localhost:3001/api/v1/bookings
router.post('', UserController.authMiddleware, BookingController.createBooking);

// http://localhost:3001/api/v1/bookings/manage
router.get('/manage', UserController.authMiddleware, BookingController.getUserBookings);

module.exports = router;
