
const { Server } = require('socket.io');
const Like = require('../user_model/likes');
const Comment = require('../user_model/comments');
const Post = require('../user_model/blogPosts');
const User = require('../user_model/users');


const initializeSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: "*",
        },
    });


    io.on('connection', (socket) => {
        socket.on('liked', async ({ commentId, userId, postId }) => {
            try {

                // Check if the like already exists
                const existingLike = await Like.findOne({ userId, commentId, postId });

                if (existingLike) {

                    console.log('User has already liked this comment or post.');
                    return;
                }

                const user = await User.findById(userId);
                const username = user.username;

                // Save the like in the database with the username so i can display it

                const newLike = new Like({ userId, commentId, postId, username });
                await newLike.save();


                let currentUser = '';

                // Increment the likes count in the comment or post

                if (commentId) {
                    await Comment.updateOne({ _id: commentId }, { $inc: { likes: 1 } });
                    io.emit('likeUpdate', { commentId, likes: await Comment.findById(commentId).select('likes -_id') });
                    currentUser = (await User.findById(userId).select('username')).username;


                    io.emit('likeNotification', { type: 'comment', commentId, postId, userId, currentUser: username });
                } else if (postId) {
                    await Post.updateOne({ _id: postId }, { $inc: { likes: 1 } });
                    io.emit('likeUpdate', { postId, likes: await Post.findById(postId).select('likes -_id') });
                    currentUser = (await User.findById(userId).select('username')).username;


                    io.emit('likeNotification', { type: 'post', commentId, postId, userId, currentUser: username });
                }
            } catch (error) {
                console.error('Error handling like:', error);
            }
        });
    });

    return io;
}

module.exports = { initializeSocket };
