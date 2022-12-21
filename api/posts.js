const express = require('express');
const postsRouter = express.Router();
const { getAllPosts } = require('../db');

postsRouter.get('/', async (req, res) => {
    console.log("A request is being made to /posts");
    const posts = await getAllPosts();
    res.send({
        posts
    });
});



module.exports = postsRouter;