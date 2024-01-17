const express = require('express');
const User = require('../user_model/userModel');
const { pageViews, getUsername, updateUsername, destroySession, scriptSomething, clickjacking, logginCheck, login, form, registerUser, loginUser, homePage, } = require('../User_Auth_Controller/AuthController');


const router = express.Router();



router.get('/', homePage);

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