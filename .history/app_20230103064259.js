// Packages
const express = require('express');
const AWS = require('aws-sdk');
const bcrypt = require('bcrypt');
const jsonwebtoken = require('jsonwebtoken');
const Sequelize = require('sequelize');

require('dotenv').config();

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
    type: Sequelize.ARRAY(Sequelize.STRING),
    validate: {
      len: [0, 5]
    }
  },
});

// Define the Comment model using Sequelize
const Comment = sequelize.define('comments', {
  user: {
    type: Sequelize.STRING,
  },
  comment: {
    type: Sequelize.STRING,
  },
});

// Set up a many-to-one relationship between Posts and Comments
Post.hasMany(Comment);
Comment.belongsTo(Post);

// Set up a one-to-many relationship between Users and Posts
User.hasMany(Post);
Post.belongsTo(User);

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
  //route to get all posts
  app.get('/posts', (req, res) => {
    Post.findAll()
      .then((posts) => {
        res.send(posts);
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
    } else if (timeDifference < 2592000000) { // Less than 1 month
      timeAgo = `${Math.floor(timeDifference / 604800000)}w ago`;
    } else if (timeDifference < 31536000000) { // Less than 1 year
      timeAgo = `${Math.floor(timeDifference / 2592000000)}m ago`;
    } else { // 1 year or more
      timeAgo = `${Math.floor(timeDifference / 31536000000)}yr ago`;
    }
    
    // Insert the post into the database
    Post.create(post)
      .then((newPost) => {
        res.send({ message: 'Post created successfully', timeAgo });
      })
      .catch((error) => {
        res.status(500).send(error);
      });
  });
  
  // A route that returns a list of all posts in the database, along with the time difference for each post
  app.get('/posts', (req, res) => {
    Post.findAll()
      .then((posts) => {
        const postsWithTimeAgo = posts.map((post) => {
          // Calculate the time difference
          const timeDifference = Date.now() - post.createdAt;
          let timeAgo;
          if (timeDifference < 60000) { // Less than 1 minute
            timeAgo = `${Math.floor(timeDifference / 1000)}s ago`;
          } else if (timeDifference < 86400000) { // Less than 1 day
            timeAgo = `${Math.floor(timeDifference / 60000)}m ago`;
          } else if (timeDifference < 604800000) { // Less than 1 week
            timeAgo = `${Math.floor(timeDifference / 86400000)}d ago`;
          } else if (timeDifference < 2592000000) { // Less than 1 month
            timeAgo = `${Math.floor(timeDifference / 604800000)}w ago`;
          } else if (timeDifference < 31536000000) { // Less than 1 year
            timeAgo = `${Math.floor(timeDifference / 2592000000)}m ago`;
          } else { // 1 year or more
            timeAgo = `${Math.floor(timeDifference / 31536000000)}yr ago`;
          }
  
          return { ...post.dataValues, timeAgo };
        });
  
        res.send(postsWithTimeAgo);
      })
      .catch((error) => {
        res.status(500).send(error);
      });
  });
  
  // A route that allows a logged in user to edit a post
  app.patch('/posts/:id', (req, res) => {
    const { title, description, attribute } = req.body;
    const { id } = req.params;
  
    Post.update({ title, description, attribute }, { where: { id } })
      .then(() => {
        res.send({ message: 'Post updated successfully' });
      })
      .catch((error) => {
        res.status(500).send(error);
      });
  });
  
  // A route that returns the comments for a specific post
  app.get('/posts/:id/comments', (req, res) => {
    const { id } = req.params;
  
    Post.findOne({ where: { id }, include: [User] })
      .then((post) => {
        if (!post) {
          res.status(404).send({ message: 'Post not found' });
        } else {
          res.send(post.comments);
        }
      })
      .catch((error) => {
        res.status(500).send(error);
      });
  });
  
// A route that allows a logged in user to add a comment to a post
app.post('/posts/:id/comments', (req, res) => {
  const { id } = req.params;
  const { comment } = req.body;

  Post.findOne({ where: { id }, include: [User] })
    .then((post) => {
      if (!post) {
        res.status(404).send({ message: 'Post not found' });
      } else {
        post.createComment({ comment })
          .then((newComment) => {
            res.send(newComment);
          })
          .catch((error) => {
            res.status(500).send(error);
          });
      }
    })
    .catch((error) => {
      res.status(500).send(error);
    });
});

// A route that returns all posts in the database, with pagination
app.get('/posts', (req, res) => {
  const { limit, offset } = req.query;

  Post.findAndCountAll({ limit, offset, include: [User] })
    .then((result) => {
      res.send({
        data: result.rows,
        total: result.count,
      });
    })
    .catch((error) => {
      res.status(500).send(error);
    });
});

// A route that returns all comments for a specific post, with pagination
app.get('/posts/:id/comments', (req, res) => {
  const { id } = req.params;
  const { limit, offset } = req.query;

  Post.findOne({ where: { id }, include: [User] })
    .then((post) => {
      if (!post) {
        res.status(404).send({ message: 'Post not found' });
      } else {
        post.getComments({ limit, offset, include: [User] })
          .then((comments) => {
            res.send(comments);
          })
          .catch((error) => {
            res.status(500).send(error);
          });
      }
    })
    .catch((error) => {
      res.status(500).send(error);
    });
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

  
  
