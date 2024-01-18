const mongoose = require('mongoose')

const postSchema = mongoose.Schema(
    {

        title: {
            type: String,
            required: true,
            unique: true
        },
        author: {
            type: String,
            required: true,
            unique: true
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

const post = mongoose.model('post', postSchema);
module.exports = post;