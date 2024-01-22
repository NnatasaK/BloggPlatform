const express = require('express');
const Post = require('../user_model/blogPosts');
const User = require('../user_model/users');
const { createPost, updatePost, updatePosts, deletePost, deletePosts, getPosts, renderHome, getPostById } = require('../User_Auth_Controller/postRouteController');


const router = express.Router();


// All the routes are used for Postman testing and for reference

router.get('/home', renderHome);
router.get('/', getPosts);
router.get('/:id', getPostById);
router.post('/add', createPost);
router.put('/:id', updatePost);
router.post('/', updatePosts);
router.delete('/', deletePost);
router.delete('/', deletePosts);





module.exports = router;