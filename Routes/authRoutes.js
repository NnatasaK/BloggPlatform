const express = require('express');
const Post = require('../user_model/blogPosts');
const User = require('../user_model/users');
const { pageViews, getUsername, updateUsername, destroySession, scriptSomething, clickjacking, loginCheck, login, form, registerUser, loginUser, loginPage, dashboard, authMiddleware, userLogout, } = require('../User_Auth_Controller/AuthController');
const { createPost, getPost, updatePost, getPostById, getEditPost, deletePost } = require('../User_Auth_Controller/postRouteController');



const router = express.Router();



router.get('/admin', loginPage);

router.post('/register', registerUser);

router.get('/', loginCheck);

router.post('/admin', loginUser);

router.get('/dashboard', authMiddleware, dashboard);

router.get('/add-post', authMiddleware, getPost);

router.post('/add-post', authMiddleware, createPost);

router.get('/edit-post/:id', authMiddleware, getEditPost);

router.put('/edit-post/:id', authMiddleware, updatePost);

router.delete('/delete-post/:id', authMiddleware, deletePost);

router.get('/logout', userLogout);



// Routes from here are for Postman testing or just for reference

router.post('/login', login);

router.get('/views', pageViews);

router.get('/form', form);

router.get('/username', getUsername);

router.get('/script', scriptSomething);

router.get('/iframe', clickjacking);

router.post('/username', updateUsername);

router.delete('/session', destroySession);







module.exports = router;