const express = require('express');
const { Client } = require('pg');
const multer = require('multer');
  
const app = express();
const PORT = 3000;

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

  app.post('/posts', upload.single('photo'), (req, res) => {
    const { title, description } = req.body;
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
  
          client.query(
            'INSERT INTO posts (user_id, title, description, photo) VALUES ($1, $2, $3, $4)',
            [userId, title, description, photo],
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
  
app.listen(PORT, (error) =>{
    if(!error)
        console.log("Server is Successfully Running, and App is listening on port "+ PORT)
    else 
        console.log("Error occurred, server can't start", error);
    }
);