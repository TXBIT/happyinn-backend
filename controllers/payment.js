const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const User = require('../models/User');
const Rental = require('../models/Rental');
const { normalizeErrors } = require('../helpers/mongoose');

const { STRIPE_SK } = require('./../config');
const stripe = require('stripe')(STRIPE_SK);

// get pending payments
exports.getPendingPayments = function(req, res) {
  const localsUser = res.locals.user;

  Payment
    .where({toUser: localsUser})
    .populate({
      path: 'booking',
      populate: {path: 'rental'}
    })
    .populate('fromUser')
    .exec((err, foundPayment) => {
      if (err) {
        return res.status(422).send({errors: normalizeErrors(err.errors)})
      }
      return res.json(foundPayment);
  });
};

// confirm payment
exports.confirmPayment = function(req, res) {
  const payment = req.body;

  const localsUser = res.locals.user;

  Payment
    .findById(payment._id)
    .populate('toUser')
    .populate('booking')
    .exec(async (err, foundPayment) => {
      if (err) res.status(422).send({errors: normalizeErrors(err.errors)});

      if (foundPayment.status === 'pending' && localsUser.id === foundPayment.toUser.id) {
        const booking = foundPayment.booking;
        const charge = await stripe.charges.create({
          amount: booking.totalPrice * 100,
          currency: 'usd',
          customer: foundPayment.fromStripeCustomerId
        });

        if (charge) {
          Booking
            .updateOne(
              {_id: booking.id},
              {status: 'active'},
              () => {}
          );

          foundPayment.charge = charge;
          foundPayment.status = 'paid';

          foundPayment.save((err) => {
            if (err) res.status(422).send({errors: normalizeErrors(err.errors)});

            User
              .updateOne(
                {_id: foundPayment.toUser.id},
                {$inc: {revenue: foundPayment.amount}},
                (err, foundUser) => {
                  if (err) res.status(422).send({errors: normalizeErrors(err.errors)});

                  return res.json({status: 'paid'});
                }
            );

          });
        }
      }

  });

};

// decline payment
exports.declinePayment = function(req, res) {

  const payment = req.body;

  const { booking } = payment;

  Booking
    .deleteOne({_id: booking._id}, (err, deletedBooking) => {
      if (err) res.status(422).send({errors: normalizeErrors(err.errors)});

      Payment
        .updateOne(
          {_id: payment._id},
          {status: 'declined'},
          () => {}
      );

      Rental
        .updateOne(
          {_id: booking.rental._id},
          {$pull: {bookings: booking._id}},
          () => {}
      );

      return res.json({status: 'deleted'});

  });

};
