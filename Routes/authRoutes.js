const express = require('express');
const Post = require('../user_model/blogPosts');
const { pageViews, getUsername, updateUsername, destroySession, scriptSomething, clickjacking, logginCheck, login, form, registerUser, loginUser, homePage, loginPage, } = require('../User_Auth_Controller/AuthController');


const router = express.Router();



router.get('/admin', loginPage);

router.get('/views', pageViews);

router.get('/form', form);

router.post('/register', registerUser);

router.post('/loginUser', loginUser);

router.get('/username', getUsername);

router.get('/script', scriptSomething);

router.get('/iframe', clickjacking);

router.post('/username', updateUsername);

router.delete('/session', destroySession);

router.get('/protected', logginCheck);

router.post('/login', login);




module.exports = router;