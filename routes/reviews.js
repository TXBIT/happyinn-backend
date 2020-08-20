const express = require('express');
const router = express.Router();

const UserController = require('../controllers/user');
const ReviewController = require('../controllers/review');

// http://localhost:3001/api/v1/reviews
router.get('', ReviewController.getReviews);

// http://localhost:3001/api/v1/reviews/:id/rating
router.get('/:id/rating', ReviewController.getRentalRating);

// http://localhost:3001/api/v1/reviews
router.post('', UserController.authMiddleware, ReviewController.createReview);

module.exports = router;
