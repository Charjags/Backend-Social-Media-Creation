const express = require('express');
const { Client } = require('pg');
const AWS = require('aws-sdk');
const bcrypt = require('bcrypt');
const jsonwebtoken = require('jsonwebtoken');
const Sequelize = require('sequelize');

require('dotenv').config();

const app = express();
const PORT = 3000;
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;

// Connect to the database using Sequelize
const sequelize = new Sequelize('startup', 'postgres', 'cjags100', {
  host: 'localhost',
  dialect: 'postgres',
  port: 5432,
});

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: 'us-east-1'
});

const s3 = new AWS.S3();

// Define the User model using Sequelize
const User = sequelize.define('users', {
  name: {
    type: Sequelize.STRING,
  },
  email: {
    type: Sequelize.STRING,
    unique: true,
  },
  username: {
    type: Sequelize.STRING,
    unique: true,
  },
  password: {
    type: Sequelize.STRING,
  },
});

// Define the Post model using Sequelize
const Post = sequelize.define('posts', {
  title: {
    type: Sequelize.STRING,
  },
  description: {
    type: Sequelize.STRING,
  },
  attribute: {
    type: Sequelize.STRING,
  },
  createdAt: {
    type: Sequelize.DATE,
  },
  imageUrl: {
    type: Sequelize.STRING,
  },
});

// A route that registers a user by inserting their name, email, and hashed password into the database
app.post('/register', (req, res) => {
  const { name, email, username, password } = req.body;

  bcrypt.hash(password, 10, (err, hash) => {
    if (err) {
      res.status(500).send(err);
    } else {
      User.create({ name, email, username, password: hash })
        .then((user) => {
          res.send({ message: 'User registered successfully!' });
        })
        .catch((error) => {
          res.status(500).send(error);
        });
    }
  });
});

// A route that logs a user in by checking their email and password against the database, and then returning a JSON web token (JWT) if the login is successful
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  User.findOne({ where: { email } })
    .then((user) => {
      if (!user) {
        res.status(404).send({ message: 'User not found' });
      } else {
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
    })
    .catch((error) => {
      res.status(500).send(error);
    });
});

// A route that creates a new post by inserting a title, description, and photo file into the database. This route uses S3 to handle the file upload.
app.post('/posts', (req, res) => {
  const { title, description, attribute } = req.body;
  const post = {
    title,
    description,
    attribute,
    createdAt: new Date(),
  };

  // Calculate the time difference
  const timeDifference = Date.now() - post.createdAt;
  let timeAgo;
  if (timeDifference < 60000) { // Less than 1 minute
    timeAgo = `${Math.floor(timeDifference / 1000)}s ago`;
  } else if (timeDifference < 86400000) { // Less than 1 day
    timeAgo = `${Math.floor(timeDifference / 60000)}m ago`;
  } else if (timeDifference < 604800000) { // Less than 1 week
    timeAgo = `${Math.floor(timeDifference / 86400000)}d ago`;
  } else {
    timeAgo = `${Math.floor(timeDifference / 604800000)}w ago`;
  }

  // Check if the request includes a file
  if (req.files && req.files.photo) {
    // The name of the input field is used to retrieve the uploaded file
    const file = req.files.photo;
    const fileName = `${Date.now()}-${file.name}`;

    // Use S3 to handle the file upload
    const params = {
      Bucket: 'my-bucket',
      Key: fileName,
      Body: file.data,
      ACL: 'public-read',
    };

    s3.upload(params, (err, data) => {
      if (err) {
        res.status(500).send(err);
      } else {
        // Save the post to the database
        post.imageUrl = data.Location;
        Post.create(post)
          .then((newPost) => {
            res.send({ message: 'Post created successfully!', newPost, timeAgo });
          })
          .catch((error) => {
            res.status(500).send(error);
          });
      }
    });
  } else {
    // Save the post to the database
    Post.create(post)
      .then((newPost) => {
        res.send({ message: 'Post created successfully!', newPost, timeAgo });
      })
      .catch((error) => {
        res.status(500).send(error);
      });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

