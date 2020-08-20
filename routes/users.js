const express = require('express');
const router = express.Router();
const User = require('../controllers/user');

// http://localhost:3001/api/v1/users/auth/:id
router.get('/:id', User.authMiddleware, User.getUser);

// http://localhost:3001/api/v1/users/auth/:id
router.put('/profile', User.authMiddleware, User.updateUser);

// http://localhost:3001/api/v1/users/auth
router.post('/auth', User.auth);

// http://localhost:3001/api/v1/users/register
router.post('/register', User.register);


module.exports = router;
