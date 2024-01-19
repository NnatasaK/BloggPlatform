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
        }
    },
    {
        timestamps: true
    }
)

const Post = mongoose.model('Post', postSchema);
module.exports = Post;