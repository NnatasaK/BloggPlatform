const express = require('express');
const Post = require('../user_model/blogPosts');
const { createPost, updatePost, updatePosts, deletePost, deletePosts, getPosts, renderHome, getPostById } = require('../User_Auth_Controller/postRouteController');


const router = express.Router();



/* router.get('/', homePage); */
router.get('/home', renderHome);
router.get('/', getPosts);
router.get('/:id', getPostById);
router.post('/add', createPost);
router.put('/:id', updatePost);
router.post('/', updatePosts);
router.delete('/', deletePost);
router.delete('/', deletePosts);





module.exports = router;