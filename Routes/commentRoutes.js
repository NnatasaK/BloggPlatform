const express = require('express');
const { authMiddleware } = require('../User_Auth_Controller/AuthController');
const { addComment, renderComments, } = require('../User_Auth_Controller/commentRouteController');
const { getPostById } = require('../User_Auth_Controller/postRouteController');

const router = express.Router();

/* router.get('/posts/:id', authMiddleware, getAddComment); */
router.get('/:id', getPostById, renderComments);

// Render comments for a specific post by ID
router.get('/:id/comments', authMiddleware, renderComments);

// Add a new comment to a specific post by ID
router.post('/:id', authMiddleware, renderComments, getPostById);

module.exports = router;


