const { Client } = require('pg');
const client = new Client('postgres://localhost:5432/juicebox-dev');

async function createUser({ username, password, name, location }) {
    try {
        const { rows: [newUser] } = await client.query(`
        INSERT INTO users(username, password, name, location)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (username) DO NOTHING 
      RETURNING *;
      `, [username, password, name, location]);

        return newUser;
    } catch (error) {
        throw error;
    }
}

async function updateUser(id, fields = {}) {
    //console.log('These are the fields: ', fields)
    const keys = Object.keys(fields);
    //console.log('These are the keys: ', keys);
    const setString = keys.map(
        (key, index) => `"${key}"=$${index + 1}`)
        .join(', ');
    //console.log('this is my setString: ', setString);
    //console.log('these are our values: ', Object.values(fields));

    //SET "name" = 'Newname Sogood', "location" = 'Lesterville, KY'
    //WHERE id = 2;
    if (setString.length === 0) {
        return;
    }

    try {
        const { rows: [user] } = await client.query(`
            UPDATE users
            SET ${setString}
            WHERE id=${id}
            RETURNING *;
            `, Object.values(fields));
        return user;
    } catch (error) {
        throw error;
    }
}

async function getAllUsers() {
    const { rows } = await client.query(`SELECT id, username, name, location, active FROM users;`);
    return rows;
}

async function createPost({ authorId, title, content, tags = [] }) {
    try {
        const { rows: [newPost] } = await client.query(`
        INSERT INTO posts ("authorId", title, content)
        VALUES ($1, $2, $3)
      RETURNING *;
      `, [authorId, title, content]);

        const tagList = await createTags(tags);

        return await addTagsToPost(newPost.id, tagList);
    } catch (error) {
        throw error;
    }
}

async function updatePost(postId, fields = {}) {
    //console.log('These are the fields: ', fields)
    const { tags } = fields;
    delete fields.tags
    const keys = Object.keys(fields);
    //console.log('These are the keys: ', keys);
    const setString = keys.map(
        (key, index) => `"${key}"=$${index + 1}`)
        .join(', ');
    //console.log('this is my setString: ', setString);
    //console.log('these are our values: ', Object.values(fields));
    /*if (setString.length === 0) {
        return;
    }*/
    try {
        if (setString.length > 0) {
            await client.query(` 
            UPDATE posts
            SET ${setString}
            WHERE id=${postId}
            RETURNING *
            `, Object.values(fields));
        }
        if (tags === undefined) {
            return await getPostById(postId);
        }
        //make any new tags that need to be made. 
        const tagList = await createTags(tags);
        //create own string
        const tagListIdString = tagList.map(
            tag => `${tag.id}`
        ).join(', ');
        //delete any post from db which arent in that tagList 
        await client.query(`
            DELETE FROM post_tags
            WHERE "tagId"
            NOT IN (${tagListIdString})
            AND "postId"=$1;
            `, [postId]);
        //call funcion addTagsToPost
        await addTagsToPost(postId, tagList);
        //return
        return await getPostById(postId);
    } catch (error) {
        throw error;
    }
}


async function getAllPosts() {
    //console.log('these are the post: ', post);
    try {
        const { rows: postIds } = await client.query(`
        SELECT id FROM posts;`);
        //console.log("these are my posts: ", posts);
        const posts = await Promise.all(postIds.map(
            post => getPostById(post.id)
        ));
        return posts;
    } catch (error) {
        throw error;
    }
}


async function getPostsByUser(userId) {
    try {
        const { rows: postIds } = await client.query(`
        SELECT id FROM posts
        WHERE "authorId"=${userId};
      `);

        const posts = await Promise.all(postIds.map(
            post => getPostById(post.id)
        ));

        return posts;
    } catch (error) {
        throw error;
    }
}

async function getUserById(userId) {
    try {
        const { rows: [user] } = await client.query(`
        SELECT id, username, name, location FROM users
        WHERE "id"=${userId};
      `);
        user.post = await getPostsByUser(userId);
        return user;

        //console.log("this is the user: ", user);

        /*if (rows.length === 0) {
            return null;
        } else {*/
    } catch (error) {
        throw error;
    }
}

async function createTags(tagList) {
    if (tagList.length === 0) {
        return;
    }
    //console.log('tagList: ', tagList);
    // need something like: $1), ($2), ($3 
    const insertValues = tagList.map(
        (_, index) => `$${index + 1}`).join('), (');
    // then we can use: (${ insertValues }) in our string template
    //console.log('insert values: ', insertValues);
    // need something like $1, $2, $3
    const selectValues = tagList.map(
        (_, index) => `$${index + 1}`).join(', ');
    // then we can use (${ selectValues }) in our string template
    //console.log('select values: ', selectValues);
    try {
        // insert the tags, doing nothing on conflict
        //after, select all tags where the name is in our taglist
        await client.query(`
        INSERT INTO tags(name)
        VALUES(${insertValues})
        ON CONFLICT (name) DO NOTHING;`, tagList)

        const { rows } = await client.query(`
         SELECT * FROM tags
        WHERE name
        IN(${selectValues})
        `, tagList);
        return rows;
        // return the rows from the query
    } catch (error) {
        throw error;
    }
}

async function createPostTag(postId, tagId) {
    try {
        await client.query(`
        INSERT INTO post_tags("postId", "tagId")
        VALUES ($1, $2)
        ON CONFLICT("postId", "tagId") DO NOTHING;
        `, [postId, tagId]);
    } catch (error) {
        throw error;
    }
}

async function addTagsToPost(postId, tagList) {
    try {
        const createPostTagPromises = tagList.map(
            tag => createPostTag(postId, tag.id)
        );

        const postTag = await Promise.all(createPostTagPromises);


        return await getPostById(postId);
    } catch (error) {
        throw error;
    }
}

async function getPostById(postId) {
    try {
        const { rows: [post] } = await client.query(`
        SELECT * FROM posts
        WHERE ID=$1
        `, [postId]);

        const { rows: tags } = await client.query(`
        SELECT tags.* from tags
        JOIN post_tags ON tags.id=post_tags."tagId"
        WHERE post_tags."postId"=$1;
        `, [postId]);

        const { rows: [author] } = await client.query(`
      SELECT id, username, name, location
      FROM users
      WHERE id=$1;
    `, [post.authorId])
        post.tags = tags;
        post.author = author;

        delete post.authorId;
        return post;
    } catch (error) {
        throw error;
    }
}

async function getPostsByTagName(tagName) {
    try {
        const { rows: postIds } = await client.query(`
        SELECT posts.id FROM posts
        JOIN post_tags ON posts.id=post_tags."postId"
        JOIN tags ON tags.id=post_tags."tagId"
        WHERE tags.name=$1;
      `, [tagName]);

        return await Promise.all(postIds.map(
            post => getPostById(post.id)
        ));
    } catch (error) {
        throw error;
    }
}


module.exports = {
    client,
    createUser,
    updateUser,
    getAllUsers,
    getUserById,
    createPost,
    updatePost,
    getAllPosts,
    getPostsByUser,
    createTags,
    createPostTag,
    addTagsToPost,
    getPostById,
    getPostsByTagName
}