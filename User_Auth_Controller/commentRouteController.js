const { Error } = require('mongoose');
const Post = require('../user_model/blogPosts');
const User = require('../user_model/users');
const Comment = require('../user_model/comments');
const Like = require('../user_model/likes');
const asyncHandler = require('express-async-handler');
const { redisStore, redisClient } = require('../helpers/redisClient');
const path = require("path");
const { getPostById } = require('../User_Auth_Controller/postRouteController');

const adminPage = '../views/layouts/admin';


// Render comments on a specific post (based on a rendering of posts on the dashboard)

const renderComments = asyncHandler(async (req, res) => {
    try {

        const id = req.params.id;

        const userId = req.userId;

        const user = await User.findById(userId);

        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }


        let perPage = 5;
        let page = req.query.page || 1;

        // Get comments associated with the specific post
        const comments = await Comment.find({ postId: id })
            .sort({ createdAt: -1 })
            .skip(perPage * page - perPage)
            .limit(perPage)
            .populate('userId')
            .exec();

        const count = await Comment.countDocuments({ postId: id });
        const nextPage = parseInt(page) + 1;
        const hasNextPage = nextPage <= Math.ceil(count / perPage);

        // Save comments to Redis
        const redisKey = `comments:${id}`;
        redisClient.set(redisKey, JSON.stringify(comments));

        // Create a new comment
        const newComment = {
            content: req.body.content,
            postId: id,
            userId: userId,
            author: user.username
        };

        await Comment.create(newComment);

        // Rendering did not work, but calling the route directly did (?)
        getPostById(req, res);
        /*  res.render('post', {
             user,
             posts,
             comments,
             current: page,
             nextPage: hasNextPage ? nextPage : null
         }); */
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add comment route

const addComment = async (req, res) => {
    try {

        const newComment = ({
            content: req.body.content
        })

        await Comment.create(newComment);

        // doesnt work
        /*  res.status(201).redirect('post',{comments}); */
    } catch (error) {

        res.status(500);
        throw new Error(error.message);
    }

}


// Like comment route

const likeComment = async (req, res) => {
    try {
        const commentId = req.params.id;
        const userId = req.userId;

        // Check if the user has already liked the comment
        const existingLike = await Like.findOne({ userId, commentId });

        if (existingLike) {
            res.status(400).json({ message: 'You have already liked this comment.' });
            return;
        }

        // Create a new like document
        const newLike = await Like.create({ userId, commentId });

        // Increment the likes count in the Comment model
        await Comment.findByIdAndUpdate(commentId, { $inc: { likes: 1 } });

        res.status(200).json({ likes: newLike.likes });
    } catch (error) {
        res.status(500);
        throw new Error(error.message);
    }
};

// Delete comment route 

const deleteComment = async (req, res) => {

    try {

        const id = req.params.id;
        const comment = await Comment.findById(id);

        if (!comment) {
            res.status(404).send('Comment not found.');
            return;
        }

        const user = await User.findById(req.userId);
        req.username = user.username;

        if (comment.author !== req.username) {
            res.status(403).send('You are not authorized to delete this comment.');
            return;
        }

        await Comment.findByIdAndDelete(id);

        res.redirect(`/posts/${comment.postId}`);

    } catch (error) {
        res.status(500);
        throw new Error(error.message);
    }
}











module.exports = {

    /* getAddComment, */
    renderComments,
    addComment,
    deleteComment,
    likeComment

}
