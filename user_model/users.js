const mongoose = require('mongoose')

const userSchema = mongoose.Schema(
    {

        username: {
            type: String,
            required: true,
            unique: true

        },
        password: {
            type: String,
            required: false,


        },
        githubId: {
            type: String,
            unique: true,
        },
        comments: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Comment'
            }],
    }
)

const User = mongoose.model('User', userSchema);
module.exports = User;