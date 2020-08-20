const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const config = require('./config');
const FakeDb = require('./fake-db');
const path = require('path');

// routes
const rentalRoutes = require('./routes/rentals');
const userRoutes = require('./routes/users');
const bookingRoutes = require('./routes/bookings');
const imageUploadRoutes = require('./routes/image-upload');
const paymentRoutes = require('./routes/payments');
const reviewRoutes = require('./routes/reviews');

// connect to database
mongoose
  .connect(config.DB_URI, {
    useNewUrlParser: true,
    useCreateIndex: true,
  })
  .then(() => {
    if (process.env.NODE_ENV !== 'production') {
      const fakeDb = new FakeDb();
      fakeDb.seedDb();
      console.log('MongoDB connected. Database seeded.');
    }
  })
  .catch((error) => console.log(error));

const app = express();

// middleware
app.use(cors());
app.use(bodyParser.json());

// using routes
app.get('/', (req, res) => res.sendStatus(200));
app.use('/api/v1/rentals', rentalRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/bookings', bookingRoutes);
app.use('/api/v1/image-upload', imageUploadRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/reviews', reviewRoutes);

const PORT = process.env.PORT || 3001;

app.listen(PORT, function () {
  console.log(`Server running on port ${PORT}`);
});

// process.on('SIGINT', () => {
//   console.info('SIGINT signal received.');

//    // Stops the server from accepting new connections and finishes existing connections.
//   server.close(function(err) {
//     // if error, log and exit with error (1 code)
//     if (err) {
//       console.error(err);
//       process.exit(1);
//     }

//     // close your database connection and exit with success (0 code)
//     // for example with mongoose
//     mongoose.connection.close(function () {
//       console.log('Mongoose connection disconnected');
//       process.exit(0);
//     })
//   })
// });
