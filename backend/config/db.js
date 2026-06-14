const mongoose = require('mongoose');

/**
 * Establishes a connection to MongoDB using the URI defined in environment
 * variables. Exits the process if the connection fails, since the API
 * cannot function without a database.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
