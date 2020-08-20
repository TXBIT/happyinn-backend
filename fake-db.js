const Rental = require('./models/Rental');
const User = require('./models/User');
const Booking = require('./models/Booking');
const Payment = require('./models/Payment');
const Review = require('./models/Review');

const fakeDbData = require('./data.json');

class FakeDb {
  constructor() {
    this.rentals = fakeDbData.rentals;

    this.users = fakeDbData.users;
  }

  async cleanDb() {
    await Rental.deleteMany({});
    await User.deleteMany({});
    await Booking.deleteMany({});
    await Payment.deleteMany({});
    await Review.deleteMany({});
  }

  pushDataToDb() {
    const admin = new User(this.users[0]);
    const user001 = new User(this.users[1]);
    const user002 = new User(this.users[2]);

    this.rentals.forEach((rental) => {
      const newRental = new Rental(rental);
      newRental.user = user001;

      user001.rentals.push(newRental);

      newRental.save();
    });

    admin.save();
    user001.save();
    user002.save();
  }

  async seedDb() {
    await this.cleanDb();
    await this.pushDataToDb();
  }
}

module.exports = FakeDb;
