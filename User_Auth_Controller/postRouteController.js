const { Error } = require('mongoose');
const Post = require('../user_model/blogPosts')
const asyncHandler = require('express-async-handler')
const { redisStore, redisClient } = require('../helpers/redisClient');
const path = require("path");




/* const homePage = async (req, res) => {
    try {
        res.status(200).render('index');

    } catch (error) {
        res.status(500);
        throw new Error(error.message);
    }
};
 */

const getPosts = async (req, res) => {

    try {
        const posts = await Post.find({});
        res.status(200).json(posts)

    } catch (error) {
        res.status(500);
        throw new Error(error.message);

    }
}
const getPostById = async (req, res) => {

    try {
        const id = req.params.id;
        const posts = await Post.findById({ _id: id });
        res.render('post', { posts });


    } catch (error) {
        res.status(500);
        throw new Error(error.message);

    }
}

const renderHome = asyncHandler(async (req, res) => {
    try {
        /* const posts = await Post.find(); */
        let perPage = 5;
        let page = req.query.page || 1;

        const posts = await Post.aggregate([{ $sort: { createdAt: -1 } }])
            .skip(perPage * page - perPage)
            .limit(perPage)
            .exec();

        const count = await Post.countDocuments();
        const nextPage = parseInt(page) + 1;
        const hasNextPage = nextPage <= Math.ceil(count / perPage);
        if (!posts || posts.length === 0) {
            // Handle case where there are no posts
            res.status(404).json({ message: 'No posts found' });
            return;
        }

        // Save posts to Redis (assuming each post has a unique identifier)
        const redisKey = 'posts';
        posts.forEach(post => {
            const redisPostKey = `post:${post._id}`;
            redisClient.set(redisPostKey, JSON.stringify(post));
        });


        // Render the index view with posts
        res.render('index', {
            posts,
            current: page,
            nextPage: hasNextPage ? nextPage : null
        });


    } catch (error) {
        res.status(500).json({ error: error.message });
    }
})
/* const renderPage = async (req, res) => {
    try {
        const products = await Product.find({});
        res.status(200).render('pages/index',
            { products })

    } catch (error) {
        res.status(500);
        throw new Error(error.message);
    }
}
 */
const createPost = async (req, res) => {
    try {
        const posts = await Post.create(req.body)
        /* res.status(201).render('pages/index',
            { products }) */
        res.status(200).json(posts);
    } catch (error) {
        res.status(400).json({ message: error.message })
        /*  res.status(500);
         throw new Error(error.message); */
    }

}

const updatePost = async (req, res) => {
    try {
        const { id } = req.params;
        const post = await Post.findByIdAndUpdate(id, req.body);
        if (!post) {
            res.status(404);
            throw new Error(`Cannot find any post with ID ${id}`);

        }
        const updatedPost = await Post.findById(id);
        const redisKey = 'posts';
        const redisPostKey = `post:${id}`;
        redisClient.set(redisPostKey, JSON.stringify(updatedPost));

        res.status(200).json(updatedPost)
    } catch (error) {
        res.status(500);
        throw new Error(error.message);
    }
}

const updatePosts = async (req, res) => {
    try {
        const updatedPosts = await Post.updateMany({}, req.body);
        /* const updatedProducts = await Product.findById(id); */
        res.status(200).json(updatedPosts)
    } catch (error) {
        res.status(500);
        throw new Error(error.message);
    }
}

const deletePost = async (req, res) => {
    try {
        const { id } = req.params;
        const post = await Post.findByIdAndDelete(id, req.body);
        if (!post) {
            return res.status(404).json({ message: `Cannot find any post with ID ${id}` })
        }
        res.status(200).json(post)
    } catch (error) {
        res.status(500);
        throw new Error(error.message);
    }
}
const deletePosts = async (req, res) => {
    try {
        const posts = await Post.deleteMany(req.body);
        res.status(200).json(posts)
    } catch (error) {
        res.status(500);
        throw new Error(error.message);
    }
}






module.exports = {
    /* homePage, */
    renderHome,
    getPosts,
    getPostById,
    createPost,
    updatePost,
    updatePosts,
    deletePost,
    deletePosts

}