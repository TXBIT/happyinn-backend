const User = require('./../models/User');
const Rental = require('./../models/Rental');
const Booking = require('./../models/Booking');
const Review = require('./../models/Review');
const moment = require('moment');
const { normalizeErrors } = require('./../helpers/mongoose');

// get reviews
exports.getReviews = function(req, res) {
  const { rentalId } = req.query;

  Review.find({ rental: rentalId })
    .populate('user')
    .exec((err, reviews) => {
      if (err) {
        return res.status(422).send({ errors: normalizeErrors(err.errors) });
      }

      return res.json(reviews);
    });
};

// create review
exports.createReview = function(req, res) {
  const reviewData = req.body;
  const { bookingId } = req.query;
  const user = res.locals.user;

  Booking.findById(bookingId)
    .populate({ path: 'rental', populate: { path: 'user' } })
    .populate('review')
    .populate('user')
    .exec(async (err, foundBooking) => {
      if (err) {
        return res.status(422).send(normalizeErrors(err.errors));
      }

      const { rental } = foundBooking;

      if (rental.user.id === user.id) {
        return res.status(422).send({
          errors: [
            {
              title: 'Invalid User!',
              detail: 'Cannot create review on your Rental!'
            }
          ]
        });
      }

      const foundBookingUserId = foundBooking.user.id;

      if (foundBookingUserId !== user.id) {
        return res.status(422).send({
          errors: [
            {
              title: 'Invalid User!',
              detail: 'Cannot write review on someone else booking'
            }
          ]
        });
      }

      const timeNow = moment();
      const endAt = moment(foundBooking.endAt);

      if (!endAt.isBefore(timeNow)) {
        return res.status(422).send({
          errors: [
            {
              title: 'Invalid Date!',
              detail:
                'You can place the review only after your trip is finished'
            }
          ]
        });
      }

      if (foundBooking.review) {
        return res.status(422).send({
          errors: [
            {
              title: 'Booking Error!',
              detail: 'Only one review per booking is allowed!'
            }
          ]
        });
      }

      const newReview = new Review(reviewData);
      newReview.user = user;
      newReview.rental = rental;
      foundBooking.review = newReview;

      Rental
        .updateOne(
          {_id: rental.id},
          {$push: { reviews: newReview}},
          () => {}
      );

      try {
        await foundBooking.save();
        await rental.save();
        const savedReview = await newReview.save();

        return res.json(savedReview);
      } catch (err) {
        return res.status(422).send({ errors: normalizeErrors(err.errors) });
      }
    });
};

// get rental rating
exports.getRentalRating = function(req, res) {
  const rentalId = req.params.id;

  Rental.findById(rentalId)
    .populate('reviews')
    .exec((err, foundRental) => {
      if (err) {
        return res.status(422).send({ errors: normalizeErrors(err.errors) });
      }

      let allRating = 0;
      for (let i = 0; i < foundRental.reviews.length; i++) {
        allRating += (foundRental.reviews[i].rating)
      }

      return res.json(allRating / foundRental.reviews.length);
    });

  // Review.aggregate(
  //   [
  //     { $unwind: '$rental' },
  //     {
  //       $group: {
  //         _id: rentalId,
  //         ratingAvg: { $avg: '$rating' }
  //       }
  //     }
  //   ],
  //   function(err, result) {
  //     if (err) {
  //       return res.status(422).send({ errors: normalizeErrors(err.errors) });
  //     }
  //     // const returnResult = result && result.length > 0 ? result[0]['ratingAvg'] : 0;
  //     return res.json(result[0]['ratingAvg']);
  //   }
  // );
};
