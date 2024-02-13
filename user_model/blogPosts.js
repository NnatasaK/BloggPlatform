const mongoose = require('mongoose')

const postSchema = mongoose.Schema(
    {

        title: {
            type: String,
            required: true,

        },
        author: {
            type: String,
            required: true,

        },
        body: {
            type: String,
            required: true
        },
        createdAt: {
            type: Date,
            default: Date.now
        },
        updatedAt: {
            type: Date,
            default: Date.now
        },

        comments: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Comment'
            }],
        likes: {
            type: Number,
            default: 0, // Default likes count is 0
        },
    },
    {
        timestamps: true
    }
)

const Post = mongoose.model('Post', postSchema);
module.exports = Post;