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

// Admin - login page render (NOT IN USE)

const loginPage = async (req, res) => {
    try {
        res.render('admin/index', { layout: adminPage });

    } catch (error) {
        res.status(500);
        throw new Error(error.message);
    }
};


// User - register

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

// User - login

const loginUser = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Check if userId is already set
        if (!req.userId) {
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

        // Set isLoggedIn in the session
        req.session.isLoggedIn = true;

        const token = jwt.sign({ userId: req.userId }, jwtSecret);
        res.cookie('token', token, { httpOnly: true });
        req.session.userId = req.userId;
        res.redirect("/dashboard");


    } catch (error) {
        res.status(500);
        throw new Error(error.message);
    }
};


// User - login trough GitHub


const loginGitHub = async (req, res) => {
    try {
        const authUrl = `https://github.com/login/oauth/authorize?client_id=${process.env.CLIENT_ID}`;
        res.redirect(authUrl);
    } catch (error) {
        res.status(500);
        throw new Error(error.message);
    }
};

const getUserInfoFromGitHub = async (access_token) => {
    const response = await fetch("https://api.github.com/user", {
        headers: {
            Authorization: `Bearer ${access_token}`,
        },
    });
    return await response.json();
};
const oauthCallback = async (req, res) => {
    try {
        const code = req.query.code;

        const response = await fetch("https://github.com/login/oauth/access_token", {
            method: "POST",
            body: new URLSearchParams({
                client_id: process.env.CLIENT_ID,
                client_secret: process.env.CLIENT_SECRET,
                code: code,
            }),
            headers: {
                Accept: "application/json",
            },
        });

        const jsonResponse = await response.json();

        // Use the GitHub user information
        const userInfo = await getUserInfoFromGitHub(jsonResponse.access_token);

        // Set session
        req.session.userId = userInfo.id.toString();  // Why convert to string?
        req.session.username = userInfo.login;

        // Check if the user already exists
        let user = await User.findOne({ githubId: req.session.userId });


        if (!user) {
            user = await User.create({ githubId: req.session.userId, username: req.session.username });
        }


        const token = jwt.sign({ userId: user._id }, jwtSecret);
        res.cookie('token', token, { httpOnly: true });

        res.redirect("/dashboard");
    } catch (error) {
        res.status(500);
        throw new Error(error.message);
    }
};



const authMiddleware = async (req, res, next) => {
    try {
        console.log('Checking authentication...');

        const token = req.cookies.token;

        if (token) {
            // GitHub OAuth login
            const decoded = jwt.verify(token, jwtSecret);
            req.userId = decoded.userId;


            const user = await User.findById(req.userId);

            if (!user) {
                console.log('User not found in the database.');
                return res.status(401).send('User not found. Please log in again.');
            }

            req.username = user.username;
            console.log('GitHub Authentication successful.');
            next();
        } else if (req.session.isLoggedIn && req.userId) {

            // Regular username/password login
            const user = await User.findById(req.userId);

            if (!user) {
                console.log('User not found in the database.');
                return res.status(401).send('User not found. Please log in again.');
            }

            req.username = user.username;
            console.log('Regular Authentication successful.');
            next();
        } else {
            console.log('No token or session found.');
            return res.status(401).send('Cannot access this page. Please log in first!');
        }
    } catch (error) {
        console.error('Authentication error:', error);
        if (error.name === 'TokenExpiredError') {
            return res.status(401).send('Token has expired. Please log in again.');
        } else if (error.name === 'JsonWebTokenError') {
            return res.status(401).send('Invalid token. Please log in again.');
        } else {
            res.status(500);
            throw new Error(error.message);
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


// Render dashboard & pagination from postRouteController (USING THIS ONE)

const dashboard = async (req, res) => {
    try {
        const userId = req.userId;

        if (!userId) {

            res.redirect('/admin');
            return;
        }

        const user = await User.findById(userId);
        req.userId = user._id;
        if (!user) {

            res.redirect('/admin');
            return;
        }

        let perPage = 5;
        let page = req.query.page || 1;

        // Get posts and post likes
        const posts = await Post.aggregate([
            { $sort: { createdAt: -1 } },
            { $skip: perPage * page - perPage },
            { $limit: perPage },
            { $lookup: { from: 'likes', localField: '_id', foreignField: 'postId', as: 'likes' } },
        ]);

        const count = await Post.countDocuments();
        const nextPage = parseInt(page) + 1;
        const hasNextPage = nextPage <= Math.ceil(count / perPage);

        if (!posts || posts.length === 0) {
            res.status(404).json({ message: 'No posts found' });
            return;
        }

        // Extract userIds from likes
        const userIdsArray = posts.reduce((acc, post) => {
            return acc.concat(post.likes.map(like => like.userId));
        }, []);

        // Get usernames from the User model
        const usernames = await User.find({ _id: { $in: userIdsArray } }, 'username');

        // Note: half clear
        posts.forEach(post => {
            post.usernames = post.likes.map(like => {
                const user = usernames.find(u => u._id.toString() === like.userId.toString());
                return user ? user.username : '';
            });
        });

        // Render the index view with posts (note : (acc))
        res.render('admin/dashboard', {
            initialLikesCount: posts.reduce((acc, post) => {
                acc[post._id] = post.likes.length;
                return acc;
            }, {}),
            posts,
            user,
            current: page,
            nextPage: hasNextPage ? nextPage : null,
            layout: adminPage,
            userId
        });

    } catch (error) {
        res.status(500);
        throw new Error(error.message);
    }
};


// User - logout

const userLogout = async (req, res) => {
    try {

        res.clearCookie('token');
        req.session.destroy();
        res.redirect('/admin');

    } catch (error) {
        res.status(500);
        throw new Error(error.message);
    }
}

// NOTE: Everything from here is reference code (NOT IN USE)

// User - basic login (just for reference)

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
    loginGitHub,
    oauthCallback,
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