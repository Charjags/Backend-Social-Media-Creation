# Backend-Social-Media-Creation
Postgres/Node Technical Coding Challenge for Pure Match

I didnt need to utilize AWS, however am heavily experienced and ceritfied for it.

First off, Thank you for allowing me the opportunity to interview and complete this project. It was fun!

This code is a server-side Node.js application that allows users to register, login, create posts, and create comments.

The following packages are required at the beginning of the code:

express
date-fns

Next, the code defines a diskStorage object using multer that specifies where to store uploaded files (in a ./uploads directory) and how to name them (using the current timestamp and the original file name). This diskStorage object is then passed to multer to create an upload object that will be used to handle file uploads.

The code then defines several routes:

/register: A route that registers a user by inserting their name, email, username, and hashed password into a users table in the database.
/login: A route that logs a user in by checking their email and password against the users table in the database, and then returning a JSON web token (JWT) if the login is successful.
/posts: A route that creates a new post by inserting a title, description, and photo file into a posts table in the database. This route uses multer to handle the file upload.
/posts/:id: A route that displays a specific post by its ID by querying the posts table in the database and returning the result.
/posts/:id/comments: A route that creates a new comment for a specific post by its ID by inserting the comment into a comments table in the database.
Each route uses the client object to connect to and query the database as needed.

Requirement 1:
Create express.js app and use postgres sql as database.
Make routes where user can register itself. Required fields of user are name, email and password.
User can login with its email and password and gets a JWT token.
Logged in users can create a post. Post has 3 attribues title, description and a photo.
Req1 Thoughts:
I began be first creating my client connecting postgers to express. Issues I ran into in this stage was it not connecting due to the name I had given the database (It was fully capital and really short). Once, I achieved connection I created the register route, which registers the user by the name, email, and hashed password. Ones the variables were called and the query was made, I hashed the password and prepared for errors by providing it an error status. For the login portion, pretty much the same route, however the query was different. I had it check for users within the db and state user not found if it wasnt in the db. I also assigned a jwt once login was successful.

I created a post route allowing for a post of certain attributes given. Using the jwt, it would be its form of identification.

Requirement 2:
A post will have an attribute when it was created.
Post returning api will calculate the time difference like 2s ago, 10d ago, 4w ago, 8m ago and 1yr ago.
A post can have multiple photos but atmost 5.
A post can be editied.
Req2 thoughts:
I revised the first post route to not only check for title and description for a post but an attribute once post is created. This wasnt too hard as all I had to do was modify the query and the const.

For the api calculating time difference, I had to install a package being able to find the difference in milliseconds from date-fns. My plan was to use that to subtract from current time and when it was posted.

For changing singular post to multiple, I decided to change it from a single upload to an upload array of 5, then mapping each photo so it would incriment to its max number.

For Photos to be editable, I found each photo id and using the token, was able to identify the post. From there, I created another client query updating the posts title, description, and user id.

Requirement 3:
A post can have multiple comments. Comments will show the user who commented and the comment.
Need to add pagination in the post and in the comments of the post.
User have the option to create their username. Update the user model.
req3 thoughts:
for multiple comments, it was mainly just manipulating the sql query.

For pagination, I used offset and limit sql queries to manipulate the original queries for calling both posts and comments. I then set a limit for pages and went through all my routes to account for errors through error statuses.

Finally, I went back to the register route and just created a username variable for it to take in a value and included it in the registration process.


