const User = require('../models/User');
const { normalizeErrors } = require('../helpers/mongoose');
const jwt = require('jsonwebtoken');
const { SECRET } = require('../config');

// get user
exports.getUser = function(req, res) {
  const requestedUserId = req.params.id;
  const localsUser = res.locals.user;

  if (requestedUserId === localsUser.id) {
    // Display all
    User
      .findById(requestedUserId, (err, foundUser) => {
        if (err) return res.status(422).json(normalizeErrors(err.errors));

        return res.json(foundUser);
    });
  } else {
    // Restrict some data
    User
      .findById(requestedUserId)
      .select('-revenue -stripeCustomerId -password')
      .exec((err, foundUser) => {
        if (err) return res.status(422).json(normalizeErrors(err.errors));

        return res.json(foundUser);
    });
  }
};

// create token
exports.auth = function(req, res) {
  // destructuring req.body
  const {
    email,
    password
  } = req.body;

  // check password and email
  if (!password || !email) {
    return sendError(res, 422, 'Data missing', 'Provide email and password');
  }

  User.findOne({
    email
  }, (err, foundUser) => {
    if (err) {
      // return res.status(422).json(err);
      return res.status(422).json(normalizeErrors(err.errors));
    }

    if (!foundUser) {
      return sendError(res, 422, 'Wrong data', 'Incorrect email or password');
    }

    if (foundUser.hasSamePassword(password)) {
      // create JWT token
      const token = jwt.sign({
        userId: foundUser.id,
        username: foundUser.username,
        email: foundUser.email,
        rentals: foundUser.rentals
      }, SECRET, {
        expiresIn: '1h'
      });

      // return token
      return res.json({
        success: true,
        token
      });

    } else {
      return sendError(res, 422, 'Wrong data', 'Incorrect email or password');
    }
  });
}

// register
exports.register = function(req, res) {
  // destructuring req.body
  const {
    username,
    email,
    password,
    passwordConfirmation
  } = req.body;

  // check password and email
  if (!password || !email) {
    return sendError(res, 422, 'Data missing', 'Provide email and password');
  }

  // check passwords
  if (password !== passwordConfirmation) {
    return sendError(res, 422, 'Invalid passwords', 'Passwords do not match');
  }

  // check if user already exists
  User.findOne({
    email
  }, (err, foundUser) => {
    if (err) {
      // return res.status(422).json(err);
      return res.status(422).send(normalizeErrors(err.errors));
    }

    if (foundUser) {
      return sendError(res, 422, 'Invalid email', 'User with the same email already exists');
    }

    // create new user
    const user = new User({
      username,
      email,
      password
    });

    // save user to database
    user.save((err) => {
      if (err) {
        return res.status(422).json(normalizeErrors(err.errors)[0]);
      }

      return res.json({
        registered: true,
        username,
        email
      });
    });
  });
}

// check token
exports.authMiddleware = function(req, res, next) {
  const token = req.headers.authorization;

  if (token) {
    const user  = parseToken(token);
    User.findById(user.userId, (err, foundUSer) => {
      if (err) {
        return res.status(422).json(normalizeErrors(err.errors));
      }

      if (foundUSer) {
        res.locals.user = foundUSer;
        next();
      } else {
        return sendError(res, 401, 'Not authorized', 'You need to login to get access');
      }
    });
  } else {
    return sendError(res, 401, 'Not authorized', 'You need to login to get access');
  }
}

// update user
exports.updateUser = (req, res, next) => {
	const user = res.locals.user;
	const { email, password, previousPassword, profileUrl } = req.body;

	if (!user.hasSamePassword(previousPassword)) {
    return sendError(res, 422, 'Invalid previousPassword', 'previousPassword do not match');
	}

	user.email = email;
	user.password = password;
	user.profileUrl = profileUrl;
	user.save((err, updatedUser) => {
		if (err) {
			return res.status(422).json(normalizeErrors(err.errors)[0]);
		}
		updatedUser.password = undefined;
		return res.json(updatedUser);
	})
}

// helper function used to send error
function sendError(res, status, title, message) {
  return res.status(status).json({title, message});
}

// helper function used to get token in string "Bearer token"
function parseToken(token) {
  // 'Bearer trueToken'
  return jwt.decode(token.split(' ')[1], SECRET);
}
