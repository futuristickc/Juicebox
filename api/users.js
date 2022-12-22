const express = require('express');
const usersRouter = express.Router();
const { getAllUsers, getUserByUsername, createUser } = require('../db');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = process.env;

//const recoveredData = jwt.verify(token, JWT_SECRET);
//recoveredData;

usersRouter.use((req, res, next) => {
    console.log("A request is being made to /users");

    //res.send({ message: 'hello from /users' });
    next();
});

usersRouter.post('/login', async (req, res, next) => {
    const { username, password } = req.body;

    // request must have both
    if (!username || !password) {
        next({
            name: "missingCredentialsError",
            message: "Please supply both a username and password"
        });
    }

    try {
        const user = await getUserByUsername(username);

        if (user && user.password == password) {
            const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET);
            res.send({ message: "you're logged in", token });
        } else {
            next({
                name: 'IncorrectCreditialsError',
                message: 'Username or password is incorrect'
            });
        }
    } catch (error) {
        console.log(error);
        next(error);
    }
});

usersRouter.post('/register', async (req, res, next) => {
    const { username, password, name, location } = req.body;

    try {
        const _user = await getUserByUsername(username);

        if (_user) {
            next({
                name: 'UserExistsError',
                message: 'A user by that username already exists'
            });
        }

        const user = await createUser({
            username,
            password,
            name,
            location,
        });

        const token = jwt.sign({
            id: user.id,
            username
        }, process.env.JWT_SECRET, {
            expiresIn: '1w'
        });

        res.send({
            message: "thank you for signing up",
            token
        });
    } catch ({ name, message }) {
        next({ name, message })
    }
});


usersRouter.get('/', async (req, res) => {
    const users = await getAllUsers();
    res.send({
        users
    });
});

module.exports = usersRouter;