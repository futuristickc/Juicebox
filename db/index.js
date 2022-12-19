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

async function createPost({ authorId, title, content }) {
    try {
        const { rows: [newPost] } = await client.query(`
        INSERT INTO posts ("authorId", title, content)
        VALUES ($1, $2, $3)
      RETURNING *;
      `, [authorId, title, content]);

        return newPost;
    } catch (error) {
        throw error;
    }
}

async function updatePost(id, fields = { title, content, active }) {
    //console.log('These are the fields: ', fields)
    //const { tags } = fields;
    const keys = Object.keys(fields);
    //delete fields.tags
    //console.log('These are the keys: ', keys);
    const setString = keys.map(
        (key, index) => `"${key}"=$${index + 1}`)
        .join(', ');
    //console.log('this is my setString: ', setString);
    //console.log('these are our values: ', Object.values(fields));

    //SET "name" = 'Newname Sogood', "location" = 'Lesterville, KY'
    //WHERE id = 2;

    try {
        const { rows: [post] } = await client.query(` 
            UPDATE posts
            SET ${setString}
            WHERE id=${id}
            RETURNING *
            `, Object.values(fields));
        return post;
        /*if (tags === undefined) {
            return await getPostById(id);
        }*/
        //make any new tags that need to be made. 
        //create own string
        //delete any post from db which arent from the 
        //call funcion addTagsToPost
        //return
    } catch (error) {
        throw error;
    }
}


async function getAllPosts() {
    //console.log('these are the post: ', post);
    try {
        const { rows: posts } = await client.query(`SELECT * FROM posts;`);
        //console.log("these are my posts: ", posts);
        return posts;
    } catch (error) {
        throw error;
    }
}


async function getPostsByUser(userId) {
    try {
        const { rows } = await client.query(`
        SELECT * FROM posts
        WHERE "authorId"=${userId};
      `);

        return rows;
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


module.exports = {
    client,
    createUser,
    updateUser,
    getAllUsers,
    createPost,
    updatePost,
    getAllPosts,
    getUserById
}