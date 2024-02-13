const { Error } = require('mongoose');
const Post = require('../user_model/blogPosts');
const User = require('../user_model/users');
const Comment = require('../user_model/comments');
const Like = require('../user_model/likes');
const asyncHandler = require('express-async-handler');
const { redisStore, redisClient } = require('../helpers/redisClient');



const adminPage = '../views/layouts/admin';

//NOT IN USE (correct route is in the AuthController)

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
            res.status(404).json({ message: 'No posts found' });
            return;
        }

        // Save posts to Redis 
        const redisKey = 'posts';
        posts.forEach(post => {
            const redisPostKey = `post:${post._id}`;
            redisClient.set(redisPostKey, JSON.stringify(post));
        });



        res.render('index', 'dashboard', {
            posts,
            current: page,
            nextPage: hasNextPage ? nextPage : null
        });


    } catch (error) {
        res.status(500).json({ error: error.message });
    }
})


// Get specific post by ID

const getPostById = async (req, res) => {
    try {
        const id = req.params.id;
        const posts = await Post.findById({ _id: id });
        const userId = req.userId;

        const user = await User.findById(userId);


        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }


        if (!posts) {
            res.status(404).json({ message: 'Post not found' });
            return;
        }

        let perPage = 5;
        let page = req.query.page || 1;

        const comments = await Comment.find({ postId: posts._id })
            .sort({ createdAt: -1 })
            .skip(perPage * page - perPage)
            .limit(perPage)
            .populate('userId')
            .exec();

        const count = await Comment.countDocuments({ postId: posts._id });
        const nextPage = parseInt(page) + 1;
        const hasNextPage = nextPage <= Math.ceil(count / perPage);

        const initialLikesCount = {};
        for (const comment of comments) {
            initialLikesCount[comment._id] = comment.likes;
        }


        res.render('post', {
            initialLikesCount,
            user,
            posts,
            comments,
            current: page,
            nextPage: hasNextPage ? nextPage : null,
            userId
        });

    } catch (error) {
        res.status(500).send(error.message);
    }
};




// Get route for creating new post

const getPost = async (req, res) => {
    try {

        res.status(201).render('admin/add-post', {

            layout: adminPage
        })
        /* res.status(200).json(posts); */
    } catch (error) {
        res.status(400).json({ message: error.message })
        /*  res.status(500);
         throw new Error(error.message); */
    }

}

// Post route for creating new post

const createPost = async (req, res) => {
    try {
        const userId = req.userId;

        const user = await User.findById(userId);

        const newPost = ({
            title: req.body.title,
            body: req.body.body,
            author: user.username
        })

        await Post.create(newPost);

        res.status(201).redirect('/dashboard');
    } catch (error) {

        res.status(500);
        throw new Error(error.message);
    }

}

// Get route for edit post

const getEditPost = async (req, res) => {

    try {
        const id = req.params.id;
        const post = await Post.findById({ _id: id });
        const user = await User.findById(req.userId);
        req.username = user.username;

        if (post.author !== req.username) {
            res.status(403).send('You are not authorized to edit this post.');
            return;
        }

        res.render('admin/edit-post', {
            post,
            layout: adminPage
        });


    } catch (error) {
        res.status(500);
        throw new Error(error.message);

    }
}

// Post route for edit post

const updatePost = async (req, res) => {
    try {
        const { id } = req.params;
        const post = await Post.findByIdAndUpdate(id, {
            title: req.body.title,
            body: req.body.body,
            updatedAt: Date.now()
        });
        if (!post) {
            res.status(404);
            throw new Error(`Cannot find any post with ID ${id}`);

        }
        const updatedPost = await Post.findById(id);
        const redisKey = 'post';
        const redisPostKey = `post:${id}`;
        redisClient.set(redisPostKey, JSON.stringify(updatedPost));

        res.redirect('/dashboard/')
    } catch (error) {
        res.status(500);
        throw new Error(error.message);
    }
}

// Delete route for delete post

const deletePost = async (req, res) => {
    try {
        const postId = req.params.id;
        const post = await Post.findById(postId);
        const user = await User.findById(req.userId);

        if (!post) {
            res.status(404).send('Post not found.');
            return;
        }

        // Check if the user has admin role
        if (user.role.includes('admin')) {
            // Admin can delete any post
            await Post.findByIdAndDelete(postId);
            res.redirect('/dashboard');
        } else {
            // Regular user can only delete their own posts
            if (post.author !== user.username) {
                res.status(403).send('You are not authorized to delete this post.');
                return;
            }

            await Post.findByIdAndDelete(postId);
            res.redirect('/dashboard');
        }
    } catch (error) {
        res.status(500);
        throw new Error(error.message);
    }
};

// NOT IN USE

// Postman test - Update multiple posts

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

// Postman test - Delete multiple posts

const deletePosts = async (req, res) => {
    try {
        const posts = await Post.deleteMany(req.body);
        res.status(200).json(posts)
    } catch (error) {
        res.status(500);
        throw new Error(error.message);
    }
}


// Postman test - Get multiple posts


const getPosts = async (req, res) => {

    try {
        const posts = await Post.find({});
        res.status(200).json(posts)

    } catch (error) {
        res.status(500);
        throw new Error(error.message);

    }
}


module.exports = {

    renderHome,
    getPost,
    getPosts,
    getPostById,
    createPost,
    updatePost,
    updatePosts,
    getEditPost,
    deletePost,
    deletePosts

}


// Some old logic for future reference

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


/* const updatePost = async (req, res) => {
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
} */

/* const homePage = async (req, res) => {
    try {
        res.status(200).render('index');

    } catch (error) {
        res.status(500);
        throw new Error(error.message);
    }
};
 */

/* const getPostById = async (req, res) => {

    try {
        const id = req.params.id;
        const posts = await Post.findById({ _id: id });
        res.render('post', { posts });


    } catch (error) {
        res.status(500);
        throw new Error(error.message);

    }
} */

// Postman test - Delete Post
/* 
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
 */

/* const deletePost = async (req, res) => {
    try {
        const { id } = req.params;
        await Post.findByIdAndDelete({ _id: id });
        res.redirect('/dashboard');
    } catch (error) {
        res.status(500);
        throw new Error(error.message);
    }
}
 */