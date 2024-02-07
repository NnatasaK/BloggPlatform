const express = require('express');
const Post = require('../user_model/blogPosts');
const User = require('../user_model/users');
const { createPost, updatePost, updatePosts, deletePost, deletePosts, getPosts, renderHome, getPostById } = require('../User_Auth_Controller/postRouteController');
const { renderComments, deleteComment } = require('../User_Auth_Controller/commentRouteController');
const { authMiddleware } = require('../User_Auth_Controller/AuthController');


const router = express.Router();


// All the routes are used for Postman testing and for reference

router.get('/home', renderHome);
router.get('/', getPosts);
router.get('/:id', authMiddleware, getPostById);  // except this one is used to render post.ejs
router.post('/add', createPost);
router.delete('/delete-comment/:id', authMiddleware, deleteComment);
router.put('/:id', updatePost);
router.post('/', updatePosts);
router.delete('/', deletePost);
router.delete('/', deletePosts);





module.exports = router;