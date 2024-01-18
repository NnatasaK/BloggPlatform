const express = require('express');
const app = express();
const session = require('express-session');
const mongoose = require('mongoose');

const MONGO_URL = process.env.MONGO_URL
const PORT = process.env.PORT || 3000
const DBname = process.env.DBname

const mongoDB = mongoose.connect(MONGO_URL, { dbName: DBname })
  .then(() => {
    app.listen(PORT, () => {
      console.log(`App running on port ${PORT}`)
    })

    console.log('connected to MongoDB')
  }).catch((error) => {
    console.log(error)
  })

process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log("MongoDB connection closed");
    process.exit(0)
  } catch (error) {
    console.error('Error closing MongoDB connection:', error);
    process.exit(1);
  }

})


module.exports = mongoDB;