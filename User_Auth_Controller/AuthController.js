const { Error } = require('mongoose');
const Post = require('../user_model/blogPosts');
const User = require('../user_model/users');
const asyncHandler = require('express-async-handler')
const { redisClient, redisStore } = require('../helpers/redisClient');
const util = require('util');
const path = require("path");
const { compareSync, hashSync } = require('bcrypt');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { access } = require('fs');
/* 
redisClient.hGet = util.promisify(redisClient.hGet); */

const adminPage = '../views/layouts/admin';
const jwtSecret = process.env.JWT_SECRET;

// Admin - login page render

const loginPage = async (req, res) => {
    try {
        res.render('admin/index', { layout: adminPage });

    } catch (error) {
        res.status(500);
        throw new Error(error.message);
    }
};

// Admin - Check Login
const authMiddleware = async (req, res, next) => {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).send('Cannot access this page. Please login first!');
    }

    try {
        const decoded = jwt.verify(token, jwtSecret);
        req.userId = decoded.userId;

        const user = await User.findById(req.userId);

        if (!user) {
            return res.status(401).send('User not found.');
        }

        req.username = user.username;

        next();
    } catch (error) {

        if (error.name === 'TokenExpiredError') {
            return res.status(401).send('Token has expired. Please log in again.');
        } else if (error.name === 'JsonWebTokenError') {
            return res.status(401).send('Invalid token. Please log in again.');
        } else {
            return res.status(500).send(error.message);
        }
    }
};

const loginCheck = async (req, res) => {
    try {
        if (req.session.isLoggedIn) {
            next();
        } else {
            res.status(401).send("Not permitted.");
        }

    } catch (error) {
        res.status(500);
        throw new Error(error.message);
    }
};


// Admin - register

const registerUser = async (req, res) => {
    try {
        const { username, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        try {
            const user = await User.create({ username, password: hashedPassword });
            res.status(201).json({ message: `${user.username} registered!` });
        } catch (mongoError) {
            if (mongoError.code === 11000) {
                res.status(409).json({ message: 'User already exists!' });
            }
            res.status(500);
            throw new Error(mongoError.message);
        }

        /* const hashedPassword =  hashSync(password, 10); */


        await redisClient.set(`user:${username}`, hashedPassword);


    } catch (error) {
        res.status(500);
        throw new Error(error.message);
    }
};



// Admin - login protected ( bcrypt )
// Only checking in Redis database, not MongoDB

const loginUser = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Check if userId is already set (e.g., by authentication middleware)
        if (!req.userId) {
            // for MongoDB also (extra code for learning purpose and reusability)
            const user = await User.findOne({ username });

            if (!user) {
                return res.status(401).json('Invalid credentials');
            }

            const validPassword = await bcrypt.compare(password, user.password);

            if (!validPassword) {
                return res.status(401).json('Invalid credentials');
            }

            // Set userId in the request
            req.userId = user._id;
        }

        const token = jwt.sign({ userId: req.userId }, jwtSecret);
        res.cookie('token', token, { httpOnly: true });
        req.session.userId = req.userId;
        res.redirect("/dashboard");
    } catch (error) {
        res.status(500);
        throw new Error(error.message);
    }
};


// Checking if user exists in Redis, otherwise check MongoDB (dont know how to do it, try later!)



// redirect to dashboard & pagination from postRouteController


const dashboard = async (req, res) => {
    try {
        const userId = req.userId;


        if (!userId) {
            // Redirect to login if userId is not set
            res.redirect('/admin');
            return;
        }

        const user = await User.findById(userId);
        req.userId = user._id;
        if (!user) {
            // Redirect to login if user is not found
            res.redirect('/admin');
            return;
        }

        let perPage = 5;
        let page = req.query.page || 1;

        const posts = await Post.aggregate([{ $sort: { createdAt: -1 } }])
            .skip(perPage * page - perPage)
            .limit(perPage)
            .exec();

        const count = await Post.countDocuments();
        const nextPage = parseInt(page) + 1;
        const hasNextPage = nextPage <= Math.ceil(count / perPage);
        if (!posts || posts.length === 0) {

            res.status(404).json({ message: 'No posts found' });
            return;
        }

        // Save posts to Redis 
        const redisKey = 'posts';
        posts.forEach(post => {
            const redisPostKey = `post:${post._id}`;
            redisClient.set(redisPostKey, JSON.stringify(post));
        });


        // Render the index view with posts


        res.render('admin/dashboard', {
            posts,
            user,
            current: page,
            nextPage: hasNextPage ? nextPage : null,
            layout: adminPage
        });


    } catch (error) {
        res.status(500);
        throw new Error(error.message);
    }
};

// Admin - logout

const userLogout = async (req, res) => {
    try {
        res.clearCookie('token');
        res.redirect('/admin');
        //  res.send('You are logged out!');

        /* setTimeout(() => {
            res.end();
            res.redirect('/admin');
        }, 2000); */


    } catch (error) {
        res.status(500);
        throw new Error(error.message);
    }
}

// Admin - basic login (just for reference)

const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        const dbPassword = await redisClient.get(`user:${username}`);
        if (password === dbPassword) {
            req.session.isLoggedIn = true;
            res.redirect("/protected");
        } else {
            res.status(401).send("Invalid Credentials");
        }

    } catch (error) {
        res.status(500);
        throw new Error(error.message);
    }
};



// bcrypt

const form = async (req, res) => {
    try {
        res.sendFile(path.join(__dirname, "../public/index.html"))

    } catch (error) {
        res.status(500);
        throw new Error(error.message);
    }
};






//Redis-connect


const getUsername = async (req, res) => {
    try {
        const username = await redisClient.get("username"); //get username
        res.send(username);

    } catch (error) {
        res.status(500);
        throw new Error(error.message);
    }
};


const updateUsername = async (req, res) => {
    try {
        await redisClient.set("username", "nnat"); //set new username
        res.send("Username updated");

    } catch (error) {
        res.status(500);
        throw new Error(error.message);
    }
};


const destroySession = async (req, res) => {
    try {
        req.session.destroy();
        res.send("session destroyed");

    } catch (error) {
        res.status(500);
        throw new Error(error.message);
    }
};

// Page views

const pageViews = async (req, res) => {
    try {
        if (!req.session.viewCount) {
            req.session.viewCount = 1;
        } else {
            req.session.viewCount += 1;
        }
        console.log(req.headers);
        res.send(`You have visited the page ${req.session.viewCount} times!`);
        /* res.render('index', { viewCount: req.session.viewCount }); */

    } catch (error) {
        res.status(500);
        throw new Error(error.message);
    }
};

//http-headers

const scriptSomething = async (req, res) => {
    try {
        res.set("Content-Security-Policy", "script-src 'self'"); //Shut down script with source other than itself.
        res.send(
            "<script src=https://cdn.jsdelivr.net/gh/Moksh45/host-xss.rocks/index.js></script>"
        );

    } catch (error) {
        res.status(500);
        throw new Error(error.message);
    }
};

const clickjacking = async (req, res) => {
    try {
        /* Clickjacking via en iframe */
        res.send(
            `<head>
    <style>
      #target_website {
        position:relative;
        width:128px;
        height:128px;
        opacity:0.00001;
        z-index:2;
        }
      #decoy_website {
        position:absolute;
        width:300px;
        height:400px;
        z-index:1;
        }
    </style>
  </head>
  <body>
    <div id="decoy_website">
    ...decoy web content here...
    </div>
    <iframe width="100%" height="1000px" id="victim_website" src="https://example.com" sandbox="allow-forms allow-scripts"></iframe>
  </body>`
        );

    } catch (error) {
        res.status(500);
        throw new Error(error.message);
    }
};




module.exports = {
    loginPage,
    pageViews,
    getUsername,
    updateUsername,
    destroySession,
    scriptSomething,
    clickjacking,
    login,
    loginCheck,
    form,
    registerUser,
    loginUser,
    dashboard,
    authMiddleware,
    userLogout

}


// Redis logic for reference

/*      const dbPassword = await redisClient.get(`user:${username}`);
     
if (compareSync(password, dbPassword)) {
    req.session.isLoggedIn = true;
    const token = jwt.sign({ userId: dbPassword._id }, jwtSecret);
    res.cookie('token', token, { httpOnly: true })
    res.redirect("/dashboard");
} else {
    res.status(401).send("Invalid credentials.");
}
*/