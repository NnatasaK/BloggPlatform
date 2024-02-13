const express = require('express');
const { authMiddleware } = require('../User_Auth_Controller/AuthController');
const { addComment, renderComments, deleteComment, likeComment } = require('../User_Auth_Controller/commentRouteController');
const { getPostById } = require('../User_Auth_Controller/postRouteController');

const router = express.Router();

/* router.get('/posts/:id', authMiddleware, getAddComment); */

router.get('/:id', getPostById, renderComments);
router.get('/:id/comments', authMiddleware, renderComments);
router.post('/:id', authMiddleware, renderComments, getPostById);

// Works only if transfered to authRoutes (do not know why)
/* 
router.delete('/posts/delete-comment/:id', authMiddleware, deleteComment); */

module.exports = router;


