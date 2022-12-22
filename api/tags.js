const express = require('express');
const tagsRouter = express.Router();
const { getAllTags, getPostsByTagName } = require('../db');

tagsRouter.get('/', async (req, res) => {
    console.log("A request is being made to /tags");
    const tags = await getAllTags();
    res.send({
        tags
    });
});

tagsRouter.get('/:tagName/posts', async (req, res, next) => {
    try {
        const allPosts = await getPostsByTagName()
        const posts = allPosts.filter(post => {
            // the post is active, doesn't matter who it belongs to
            if (post.active) {
                return true;
            }

            // the post is not active, but it belogs to the current user
            if (req.user && post.author.id === req.user.id) {
                return true;
            }

            // none of the above are true
            return false;
        })
        res.send({ post: posts });
    } catch ({ name, message }) {
        next({ name, message })
    }
});



module.exports = tagsRouter;