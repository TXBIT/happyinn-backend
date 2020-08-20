const Booking = require('../models/Booking');
const Rental = require('../models/Rental');
const User = require('../models/User');
const Payment = require('../models/Payment');
const { normalizeErrors } = require('../helpers/mongoose');
const moment = require('moment');

const { STRIPE_SK } = require('./../config');
const stripe = require('stripe')(STRIPE_SK);

const CUSTOMER_SHARE = 0.9;

// create new booking
exports.createBooking = function(req, res) {
  const {
    startAt,
    endAt,
    totalPrice,
    guests,
    days,
    rental,
    paymentToken
  } = req.body;

  const localsUser = res.locals.user;

  const booking = new Booking({startAt, endAt, totalPrice, guests, days});

  Rental
    .findById(rental._id)
    .populate('bookings')
    .populate('users')
    .exec(async function(err, foundRental) {

      if (err) {
        return res.status(422).json(normalizeErrors(err.errors));
      }

      if (foundRental.user.toString() === localsUser.id) {
        return sendError(res, 422, 'Invalid user', 'Cannot create booking on your Rental');
      }

      if (isValidBooking(booking, foundRental)) {
        booking.user = localsUser;
        booking.rental = foundRental;
        foundRental.bookings.push(booking);

        const { payment, err } = await createPayment(booking, foundRental.user, paymentToken);

        if (payment) {
          booking.payment = payment;

          booking.save(function(err) {
            if (err) {
              return res.status(422).json(normalizeErrors(err.errors));
            }

            foundRental.save();
            User.updateOne(
              {
                _id: localsUser.id
              },
              {
                $push: {
                  bookings: booking
                }
              },
              () => {}
            );

            return res.json({
              startAt: booking.startAt,
              endAt: booking.endAt
            });

          });
        } else {
          return sendError(res, 422, 'Payment error', err);
        }

      } else {
        return sendError(res, 422, 'Invalid booking', 'Chosen dates are already taken');
      }

  });

}

// get user bookings
exports.getUserBookings = function(req, res) {
  const localsUser = res.locals.user;

  Booking
    .where({user: localsUser})
    .populate('rental')
    .exec((err, foundBookings) => {
      if (err) {
        return res.status(422).json(normalizeErrors(err.errors));
      }

      return res.json(foundBookings);

  });
}

// helper function used to send error
function sendError(res, status, title, message) {
  return res.status(status).json({title, message});
}

// helper function used to check if booking is valid
function isValidBooking(proposedBooking, rental) {
  let isValid = true;

  if (rental.bookings && rental.bookings.length > 0) {
    isValid = rental.bookings.every(function(booking) {
      const proposedStart = moment(proposedBooking.startAt);
      const proposedEnd = moment(proposedBooking.endAt);
      
      const actualStart = moment(booking.startAt);
      const actualEnd = moment(booking.endAt);

      return (actualStart < proposedStart && actualEnd < proposedStart) || (proposedEnd < actualEnd && proposedEnd < actualStart);
    });
  }

  return isValid;
}

// create new payment
async function createPayment(booking, toUser, token) {
  const { user } = booking;

  const customer = await stripe.customers.create({
    source: token.id,
    email: user.email
  });

  if (customer) {
    User
      .updateOne(
        {_id: user.id},
        {$set: {stripeCustomerId: customer.id}},
        () => {}
    );

    const payment = new Payment({
      fromUser: user,
      toUser: toUser,
      fromStripeCustomerId: customer.id,
      booking: booking,
      tokenId: token.id,
      amount: booking.totalPrice * 100 * CUSTOMER_SHARE
    });

    try {
      const savedPayment = await payment.save();
      return {payment: savedPayment};
    } catch(err) {
      return {err: err.message};
    }

  } else {
    return {err: 'Cannot process payment'};
  }

}
