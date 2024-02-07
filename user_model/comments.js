const mongoose = require('mongoose');

const commentSchema = mongoose.Schema(
    {
        postId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Post',
            required: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        author: {
            type: String,
            required: true,

        },
        content: {
            type: String,
            required: true,
        },
        htmlContent: {
            type: String, // Store HTML-formatted content
        },
    },
    {
        timestamps: true,
    }
);

const Comment = mongoose.model('Comment', commentSchema);
module.exports = Comment;
