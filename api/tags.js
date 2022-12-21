const express = require('express');
const tagsRouter = express.Router();
const { getAllTags } = require('../db');

tagsRouter.get('/', async (req, res) => {
    console.log("A request is being made to /tags");
    const tags = await getAllTags();
    res.send({
        tags
    });
});



module.exports = tagsRouter;