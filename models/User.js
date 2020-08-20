const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcryptjs');
const saltRounds = 10;

const userSchema = new Schema({
  username: {
    type: String,
    min: [4, 'Too short, min is 4 characters'],
    max: [32, 'Too long, max is 32 characters']
  },

  email: {
    type: String,
    min: [4, 'Too short, min is 4 characters'],
    max: [32, 'Too long, max is 32 characters'],
    unique: true,
    lowercase: true,
    required: 'Email is required',
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/]
  },

  password: {
    type: String,
    min: [4, 'Too short, min is 4 characters'],
    max: [32, 'Too long, max is 32 characters'],
    required: 'Password is required'
  },

	profileUrl: {
		type: String,
	},

  stripeCustomerId: String,

  revenue: Number,

  rentals: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Rental'
    }
  ],

  bookings: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Booking'
    }
  ]

  // admin, moderator, host, guest, anonymous
  // role: {
  //   type: String,
  //   default: 'anonymous'
  // }

});

// check password
userSchema.methods.hasSamePassword = function(requestedPassword) {
  return bcrypt.compareSync(requestedPassword, this.password);
};

// hash password before saving user to database
userSchema.pre('save', function(next) {
  const user = this;
  bcrypt.genSalt(saltRounds, function(err1, salt) {
    bcrypt.hash(user.password, salt, function(err2, hash) {
      user.password = hash;
      next();
    });
  });
});

module.exports = mongoose.model('User', userSchema);
