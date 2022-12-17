const express = require('express');
const { Client } = require('pg');
const multer = require('multer');
const { differenceInMilliseconds, formatDistance } = require('date-fns');
  
const app = express();
const PORT = 3000;

//postgres client
const client = new Client({
    user:'postgres',
    host: 'localhost',
    database: 'startup',
    password: 'cjags100',
    port: 5432,
  });
  
  client.connect();

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, './uploads');
    },
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    },
  });
  
  const upload = multer({ storage });

  //a route that registers a user by inserting their name, email, and hashed password into a users table in a PostgreSQL database.
app.post('/register', (req, res) => {
    const { name, email, password } = req.body;
  
    bcrypt.hash(password, 10, (err, hash) => {
      if (err) {
        res.status(500).send(err);
      } else {
        client.query(
          'INSERT INTO users (name, email, password) VALUES ($1, $2, $3)',
          [name, email, hash],
          (error, result) => {
            if (error) {
              res.status(500).send(error);
            } else {
              res.send({ message: 'User registered successfully!' });
            }
          }
        );
      }
    });
  });
  //a route that logs a user in by checking their email and password against the users table in the database, and then returning a JSON web token (JWT) if the login is successful.
  app.post('/login', (req, res) => {
    const { email, password } = req.body;
  
    client.query(
      'SELECT * FROM users WHERE email = $1',
      [email],
      (error, result) => {
        if (error) {
          res.status(500).send(error);
        } else if (result.rows.length === 0) {
          res.status(404).send({ message: 'User not found' });
        } else {
          const user = result.rows[0];
  
          bcrypt.compare(password, user.password, (err, same) => {
            if (err) {
              res.status(500).send(err);
            } else if (!same) {
              res.status(401).send({ message: 'Incorrect password' });
            } else {
              const token = jsonwebtoken.sign({ email }, 'secret');
              res.send({ message: 'Logged in successfully', token });
            }
          });
        }
      }
    );
  });
//a route that creates a new post by inserting a title, description, and photo file into a posts table in the database. This route uses multer to handle the file upload.
  app.post('/posts', upload.single('photo'), (req, res) => {
    const { title, description, attribute} = req.body;
    const photo = req.file.filename;
  
    const token = req.headers.authorization;
    const { email } = jsonwebtoken.verify(token, 'secret');
  
    client.query(
      'SELECT id FROM users WHERE email = $1',
      [email],
      (error, result) => {
        if (error) {
          res.status(500).send(error);
        } else {
          const userId = result.rows[0].id;
            //a route that displays a specific post by its ID by querying the posts table in the database and returning the result.
            // a route that creates a new comment for a specific post by its ID by inserting the comment into a comments table in the database.
          client.query(
            'INSERT INTO posts (user_id, title, description, photo, attribute) VALUES ($1, $2, $3, $4)',
            [userId, title, description, photo, attribute],
            (err, result) => {
              if (err) {
                res.status(500).send(err);
              } else {
                res.send({ message: 'Post created successfully!' });
              }
            }
          );
        }
      }
    );
  });
  //a route that displays a list of all posts by querying the posts table in the database and returning the results.
  app.get('/posts', (req, res) => {
    client.query('SELECT * FROM posts', (error, result) => {
      if (error) {
        res.status(500).send(error);
      } else {
        res.send(result.rows);
      }
    });
  });
  app.get('/posts', (req, res) => {
    client.query('SELECT * FROM posts', (error, result) => {
      if (error) {
        res.status(500).send(error);
      } else {
        const currentTime = new Date();
  
        // Map the time difference for each post
        const formattedPosts = result.rows.map((post) => {
          const postTime = new Date(post.created_at);
          const timeDifference = differenceInMilliseconds(currentTime, postTime);
          return {
            ...post,
            timeDifference: formatDistance(timeDifference, { addSuffix: true }),
          };
        });
  
        res.send(formattedPosts);
      }
    });
  });
app.listen(PORT, (error) =>{
    if(!error)
        console.log("Server is Successfully Running, and App is listening on port "+ PORT)
    else 
        console.log("Error occurred, server can't start", error);
    }
);