import express from 'express';
import * as todosDao from '../../db/todos-dao';
import mongoose from 'mongoose';
const jwt = require('express-jwt');
const jwtAuthz = require('express-jwt-authz');
const jwksRsa = require('jwks-rsa');


// const HTTP_OK = 200; // Not really needed; this is the default if you don't set something else.
const HTTP_CREATED = 201;
const HTTP_NOT_FOUND = 404;
const UNAUTHENTICATED = 401;
const HTTP_NO_CONTENT = 204;
const HTTP_BAD_REQUEST = 400;

const router = express.Router();

const checkJwt = jwt({
    // Dynamically provide a signing key
    // based on the kid in the header and 
    // the signing keys provided by the JWKS endpoint.
    secret: jwksRsa.expressJwtSecret({
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 5,
      jwksUri: `https://zach.au.auth0.com/.well-known/jwks.json`
    }),
  
    // Validate the audience and the issuer.
    audience: 'superTodo',
    issuer: [`https://zach.au.auth0.com/`],
    algorithms: ['RS256']
  });



// TODO Exercise Four: Add your RESTful routes here.

/**
 * A trick to include the check for a valid id in one place, rather than in every single method that needs it.
 * If "next()" is called, the next route below that matches will be called. Otherwise, we just end the response.
 * The "use()" function will match ALL HTTP request method types (i.e. GET, PUT, POST, DELETE, etc).
 */
router.use('/:id', checkJwt,async (req, res, next) => {
    const { id } = req.params;
    if (mongoose.isValidObjectId(id)) {
        next();
    }
    else {
        res.status(HTTP_BAD_REQUEST)
            .contentType('text/plain').send('Invalid ID');
    }
});

// Create todo
router.post('/',checkJwt, async (req, res) => {

    if (!req.body.title) {
        res.status(HTTP_BAD_REQUEST)
            .contentType('text/plain').send('New todos must have a title');
        return;
    }
    const tempTodo= req.body;
    tempTodo.userSub=req.user.sub;
    const newTodo = await todosDao.createTodo(tempTodo);
    res.status(HTTP_CREATED)
        .header('location', `/api/todos/${newTodo._id}`)
        .json(newTodo);
});

// Retrieve todo list
router.get('/', checkJwt,async (req, res) => {
    // Uncomment this code if you want to introduce an artificial delay.
    // setTimeout(async () => {
    //     res.json(await todosDao.retrieveAllTodos());
    // }, 2000);

    // Comment this code if you want to introduce an artificial delay.
    res.json(await todosDao.retrieveAllTodos(req.user.sub));
});

// Retrieve single todo
router.get('/:id', checkJwt,async (req, res) => {
    const {id} = req.params;
    const todo = await todosDao.retrieveTodo(id);
    
    if (!todo) {
        res.sendStatus(HTTP_NOT_FOUND);
        
    }else if(todo.userSub!==req.user.sub){
        res.sendStatus(UNAUTHENTICATED)

    }
    else {
        res.json(todo);
    }
});

// Update todo
router.put('/:id', checkJwt,async (req, res) => {
    const { id } = req.params;
    const todo = {
        ...req.body,
        _id: id
    };
    const success = await todosDao.updateTodo(todo);
    if (todo.userSub!==req.user.sub){
        res.sendStatus(UNAUTHENTICATED)
        return;
    }
    res.sendStatus(success ? HTTP_NO_CONTENT : HTTP_NOT_FOUND);
});

// Delete todo
router.delete('/:id', checkJwt,async (req, res) => {
    const { id } = req.params;
    const todo = await todosDao.retrieveTodo(id);

    if(todo){
        if(todo.userSub!==req.user.sub){
            res.sendStatus(UNAUTHENTICATED)
            return
        }
    }
    await todosDao.deleteTodo(id);
    res.sendStatus( HTTP_NO_CONTENT );
   
})

export default router;