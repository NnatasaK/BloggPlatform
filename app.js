
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
/* const MongoStore = require('connect-mongo'); */
const session = require('express-session');
const connectRedis = require('connect-redis');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const path = require("path");
const userRoute = require('./Routes/authRoutes');
const postRoute = require('./Routes/postRoutes');
const commentRoute = require('./Routes/commentRoutes');
const errorMiddleware = require('./error_middleware/errorMiddleware');

const { default: helmet } = require('helmet');
const { redisStore, redisClient } = require('./helpers/redisClient');
const ejsLayout = require('express-ejs-layouts');
const methodOverride = require('method-override');


const MONGO_URL = process.env.MONGO_URL
const PORT = process.env.PORT || 3000
const DBname = process.env.DBname
const SECRET = process.env.SECRET

const app = express();


app.use(cookieParser());

app.use(helmet());


app.use(session({
  name: process.env.SESSION_NAME,
  secret: SECRET,
  resave: true,
  saveUninitialized: true,
  store: redisStore,
  cookie: { maxAge: 3600000, httpOnly: true }

}));



app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());
app.use(bodyParser.json());
app.set('layout', './layouts/main');
app.set("view engine", "ejs");
app.use(errorMiddleware);
app.use(express.static("public"));
app.use(ejsLayout);
app.use(methodOverride('_method'))
app.use('/', userRoute);
app.use('/posts', postRoute);
app.use('/comments', commentRoute);


/* app.use('/posts/:id/comments', commentRoute); */






mongoose.connect(MONGO_URL, { dbName: DBname })
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




// old code for reference

// Note:  Learn better the order of things

// Note:  Save MongoDB connection into a separate file


/*

app.get("/form", (_req, res) =>
  res.sendFile(path.join(__dirname, "public/index.html"))
);

*/

/* Modifies session if username and password match.

app.post("/login", (req, res) => {
  if (req.body.username === "kristian" && req.body.password === "123") {
    req.session.isAuthenticated = true;
    return res.send("You are now logged in!");
  }
  res.send("Invalid Credentials");
});
*/


/* A route that returns differently depending on whether you are authenticated or not.

app.get("/protected", (req, res) => {
  if (!req.session.isAuthenticated) {
    return res.send("Not authenticated!");
  }
  res.send("Authenticated!");
});


*/

