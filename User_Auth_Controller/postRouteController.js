const { Error } = require('mongoose');
const post = require('../user_model/blogPosts')
const asyncHandler = require('express-async-handler')
const { redisStore, client } = require('../helpers/redisClient');
const path = require("path");




const homePage = async (req, res) => {
    try {
        res.render('index');

    } catch (error) {
        res.status(500);
        throw new Error(error.message);
    }
};








module.exports = {
    homePage,

}