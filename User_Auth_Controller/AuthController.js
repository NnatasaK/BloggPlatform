const { Error } = require('mongoose');
const User = require('../user_model/userModel')
const asyncHandler = require('express-async-handler')
const { redisStore, client } = require('../helpers/redisClient');
const path = require("path");
const { compareSync, hashSync } = require('bcrypt');

// Show page views with render or headers

const homePage = async (req, res) => {
    try {
        res.render('index');

    } catch (error) {
        res.status(500);
        throw new Error(error.message);
    }
};
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

// redis-user-login

const logginCheck = async (req, res) => {
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

const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        const dbPassword = await client.get(`user:${username}`);
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

const registerUser = async (req, res) => {
    try {
        const { username, password } = req.body;

        //HashSync tar emot 2 argument.
        // 1. Lösenordet som ska hashas.
        // 2. Hur många omgångar det ska saltas. Mer salt = långsammare och säkrare
        const hashedPassword = hashSync(password, 10);

        //Med detta så lagras det hashade värdet i databasen.
        await client.set(`user:${username}`, hashedPassword);
        res.send("Successfully registered!");

    } catch (error) {
        res.status(500);
        throw new Error(error.message);
    }
};

const loginUser = async (req, res) => {
    try {
        const { username, password } = req.body;
        const dbPassword = await client.get(`user:${username}`);
        //CompareSync hashar det första argumentet och kollar om det blir det andra argumentet.
        if (compareSync(password, dbPassword)) {
            req.session.isLoggedIn = true;
            res.redirect("/protected");
        } else {
            res.status(401).send("Invalid credentials.");
        }

    } catch (error) {
        res.status(500);
        throw new Error(error.message);
    }
};



//Redis-connect


const getUsername = async (req, res) => {
    try {
        const username = await client.get("username"); //get username
        res.send(username);

    } catch (error) {
        res.status(500);
        throw new Error(error.message);
    }
};


const updateUsername = async (req, res) => {
    try {
        await client.set("username", "nnat"); //set new username
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
    homePage,
    pageViews,
    getUsername,
    updateUsername,
    destroySession,
    scriptSomething,
    clickjacking,
    login,
    logginCheck,
    form,
    registerUser,
    loginUser
}