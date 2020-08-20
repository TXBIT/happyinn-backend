const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const paymentSchema = new Schema({
  // user who made booking - we will charge this user
  fromUser: { type: Schema.Types.ObjectId, ref: 'User'},

  fromStripeCustomerId: String,

  // owner of rental on which booking was created - give money to this user
  toUser: { type: Schema.Types.ObjectId, ref: 'User'},

  booking: { type: Schema.Types.ObjectId, ref: 'Booking' },

  amount: Number,

  tokenId: String,

  charge: Schema.Types.Mixed,

  status: { type: String, default: 'pending'}
});

module.exports = mongoose.model('Payment', paymentSchema);
