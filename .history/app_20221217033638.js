const express = require('express');
const { Client } = require('pg');
  
const app = express();
const PORT = 3000;

const client = new Client({
    host: 'localhost',
    database: 'SM',
    password: 'cjags100',
    port: 5432,
  });
  
  client.connect();

  
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
  
app.listen(PORT, (error) =>{
    if(!error)
        console.log("Server is Successfully Running, and App is listening on port "+ PORT)
    else 
        console.log("Error occurred, server can't start", error);
    }
);