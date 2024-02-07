const { Error } = require('mongoose');
const Post = require('../user_model/blogPosts');
const User = require('../user_model/users');
const Comment = require('../user_model/comments');
const asyncHandler = require('express-async-handler');
const { redisStore, redisClient } = require('../helpers/redisClient');
const path = require("path");
const { getPostById } = require('../User_Auth_Controller/postRouteController');

const adminPage = '../views/layouts/admin';

// Render comments on a specific post (based on a rendering of posts on the dashboard)

const renderComments = asyncHandler(async (req, res) => {
    try {

        const id = req.params.id;
        /*  const posts = await Post.findById({ _id: id }); */
        const userId = req.userId;

        const user = await User.findById(userId);

        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }


        let perPage = 5;
        let page = req.query.page || 1;

        // Fetch comments associated with the specific post
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


// Get route for Add Comment

/* const getAddComment = async (req, res) => {

    try {
        const id = req.params.id;
        const post = await Post.findById({ _id: id });
        const user = await User.findById(req.userId);
        req.username = user.username;

        res.render('admin/comments', {
            post,
            layout: adminPage
        });
    } catch (error) {
        res.status(500).send(error.message);
    }
} */

// Post route for Add Comment

/* const addComment = async (req, res) => {
    try {
        const userId = req.userId;
        const user = await User.findById(userId);
        const post = await Post.findById({ _id: id });
        const newComment = ({
            postId: post,
            userId: user,
            content: req.body.content
        })

        await Comment.create(newComment);
        res.status(201).redirect('/post');

    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal Server Error');
    }
};
 */
const addComment = async (req, res) => {
    try {
        /*  const userId = req.userId;
 
         const user = await User.findById(userId); */
        /* const id = req.params.id;
        const posts = await Post.findById({ _id: id });
        const comments = await Comment.find({ postId: posts._id }); */
        const newComment = ({
            content: req.body.content
        })

        await Comment.create(newComment);

        /*  res.status(201).redirect('post',{comments}); */
    } catch (error) {

        res.status(500);
        throw new Error(error.message);
    }

}



// Delete route for Delete Comment


/* const deleteComment = async (req, res) => {
    try {
        const commentId = req.params.id;
        const userId = req.userId;

        const comment = await Comment.findOneAndDelete({
            _id: commentId,
            userId: userId,
        });

        if (!comment) {
            res.status(404).send('Comment not found.');
            return;
        }

        res.status(200).send({ message: 'Comment deleted successfully.' });
    } catch (error) {
        res.status(500).send(error.message);
    }
};
 */






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
    deleteComment

}
