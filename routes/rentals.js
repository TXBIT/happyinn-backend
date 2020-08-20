const express = require('express');
const router = express.Router();
const Rental = require('../models/Rental');
const User = require('../models/User');
const UserController = require('../controllers/user');
const { normalizeErrors } = require('../helpers/mongoose');

// http://localhost:3001/api/v1/rentals/secret
router.get('/secret', UserController.authMiddleware, (req, res) => {
  res.json({
    secret: true
  });
});

// http://localhost:3001/api/v1/rentals/manage
router.get('/manage', UserController.authMiddleware, (req, res) => {
  const localsUser = res.locals.user;

  Rental
    .where({user: localsUser})
    .populate('bookings')
    .exec((err, foundRentals) => {
      if (err) {
        return res.status(422).json(normalizeErrors(err.errors));
      }

      return res.json(foundRentals);

  });

});

// http://localhost:3001/api/v1/rentals
router.get('', (req, res) => {
  // .select('-bookings')
  const city = req.query.city;
  const query = city ? {city: city.toLowerCase()} : {};

  Rental
    .find(query)
    .exec((err, foundRentals) => {
      if (err) {
        return res.status(422).json(normalizeErrors(err.errors));
      }

      if (city && foundRentals.length === 0) {
        return res.status(422).send({
          errors: [
            {
              title: 'No rentals found',
              message: `There are no rentals for ${city} city`
            }
          ]
        });
      }

      return res.json(foundRentals);
  });

});

// http://localhost:3001/api/v1/rentals/:id/verify-user
router.get('/:id/verify-user', UserController.authMiddleware, (req, res) => {
  const localsUser = res.locals.user;

  Rental
    .findById(req.params.id)
    .populate('user')
    .exec((err, foundRental) => {
      if (err) {
        return res.status(422).json(normalizeErrors(err.errors));
      }

      if (foundRental.user.id !== localsUser.id) {
        return res.status(422).send({
          errors: [
            {
              title: 'Invalid user',
              message: 'You are not rental owner'
            }
          ]
        });
      }

      return res.json({
        status: 'verified'
      });
  });
});

// http://localhost:3001/api/v1/rentals/:id
router.get('/:id', (req, res) => {
  const rentalId = req.params.id;

  // .populate('user', 'username -_id')
  // .populate('bookings', 'startAt endAt -_id')

  Rental
    .findById(rentalId)
    .populate('user')
    .populate('bookings')
    .exec((err, foundRental) => {
      if (err || !foundRental) {
        return res.status(422).send({
          errors: [
            {
              title: 'Rental Error',
              message: 'Could not find rental'
            }
          ]
        });
      }

      return res.json({foundRental});
  });

});

// http://localhost:3001/api/v1/rentals
router.post('', UserController.authMiddleware, (req, res) => {
  const {
    title,
    city,
    street,
    category,
    image,
    shared,
    bedrooms,
    description,
    dailyRate
  } = req.body;

  const localsUser = res.locals.user;

  const rental = new Rental({
    title,
    city,
    street,
    category,
    image,
    shared,
    bedrooms,
    description,
    dailyRate
  });

  rental.user = localsUser;

  Rental.create(rental, (err, newRental) => {
    if (err) {
      return res.status(422).json(normalizeErrors(err.errors));
    }

    User.updateOne(
      {
        _id: localsUser.id
      },
      {
        $push: {
          rentals: newRental
        }
      },
      function() {}
    );

    return res.json(newRental);

  });

});

// http://localhost:3001/api/v1/rentals/:id
router.delete('/:id', UserController.authMiddleware, (req, res) => {

  const localsUser = res.locals.user;
  const userRentals = localsUser.rentals;
  console.log(userRentals);

  Rental
    .findById(req.params.id)
    .populate('user')
    .populate({
      path: 'bookings',
      select: 'startAt',
      match: {
        startAt: {
          $gt: new Date()
        }
      }
    })
    .exec((err, foundRental) => {
      if (err) {
        return res.status(422).json(normalizeErrors(err.errors));
      }

      if (localsUser.id !== foundRental.user.id) {
        return res.status(422).send({
          errors: [
            {
              title: 'Invalid user',
              message: 'You are not rental owner'
            }
          ]
        });
      }

      if (foundRental.bookings.length > 0) {
        return res.status(422).send({
          errors: [
            {
              title: 'Active bookings',
              message: 'Cannot delete rental with active bookings'
            }
          ]
        });
      }

      

      foundRental.remove((err) => {
        if (err) {
          return res.status(422).json(normalizeErrors(err.errors));
        }
        const filtered = [];
        for (let i = 0; i < userRentals.length; i++) {
          if (userRentals[i] != foundRental.id) filtered.push(userRentals[i]);
        }
        
        User
          .updateOne(
            {
              _id: localsUser.id
            },
            {
              $set: {
                rentals: filtered
              }
            },
            () => {}
        );

        return res.json({
          status: 'deleted',
          deletedRental: foundRental
        });
      });
  });

});

// http://localhost:3001/api/v1/rentals/:id
router.patch('/:id', UserController.authMiddleware, (req, res) => {

  const rentalData = req.body;
  const localsUser = res.locals.user;

  Rental
    .findById(req.params.id)
    .populate('user')
    .exec((err, foundRental) => {
      if (err) {
        return res.status(422).json(normalizeErrors(err.errors));
      }

      if (localsUser.id !== foundRental.user.id) {
        return res.status(422).send({
          errors: [
            {
              title: 'Invalid user',
              message: 'You are not rental owner'
            }
          ]
        });
      }

      foundRental.set(rentalData);
      foundRental.save((err) => {
        if (err) {
          return res.status(422).json(normalizeErrors(err.errors));
        }

        return res.status(200).send(foundRental)
      });
  });

});

module.exports = router;
