// app.js
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const session = require('express-session');
const app = express();
const port = 3000;

// Use MongoDB for data storage
mongoose.connect('mongodb://localhost:27017/authexample', { useNewUrlParser: true, useUnifiedTopology: true });

// Define user schema
const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  email: String,
});

const User = mongoose.model('User', userSchema);

app.use(bodyParser.urlencoded({ extended: true }));

// Set up session
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false,
}));

// Middleware to check if user is logged in
const requireLogin = (req, res, next) => {
  if (req.session.userId) {
    next();
  } else {
    res.redirect('/login');
  }
};

// Route for the home page
app.get('/', requireLogin, (req, res) => {
  res.send('Hello, ' + req.session.username + '! <a href="/logout">Logout</a>');
});

// Route for the login page
app.get('/login', (req, res) => {
  res.sendFile(__dirname + '/login.html');
});

// Handle login form submission
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username });

  if (user && bcrypt.compareSync(password, user.password)) {
    req.session.userId = user._id;
    req.session.username = user.username;
    res.redirect('/');
  } else {
    res.send('Login failed. Please try again. <a href="/login">Back to Login</a>');
  }
});

// Route for the registration page
app.get('/register', (req, res) => {
  res.sendFile(__dirname + '/register.html');
});

// Handle registration form submission
app.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  // Hash the password
  const hashedPassword = bcrypt.hashSync(password, 10);

  // Create a new user
  const user = new User({
    username,
    email,
    password: hashedPassword,
  });

  await user.save();
  res.send('Registration successful! <a href="/login">Login</a>');
});

// Route for the password reset page
app.get('/reset-password', (req, res) => {
  res.sendFile(__dirname + '/reset-password.html');
});

// Handle password reset form submission
app.post('/reset-password', async (req, res) => {
  const { email } = req.body;

  // Generate a random password reset token (for simplicity, you can use a library like `crypto` for a more secure token)
  const resetToken = Math.random().toString(36).slice(2);

  // Update the user's record with the reset token
  await User.updateOne({ email }, { $set: { resetToken } });

  // Send a password reset email
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'your-email@gmail.com',
      pass: 'your-email-password',
    },
  });

  const mailOptions = {
    from: 'your-email@gmail.com',
    to: email,
    subject: 'Password Reset',
    text: `Click the following link to reset your password: http://localhost:3000/reset-password/${resetToken}`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
      res.send('Error sending email. Please try again.');
    } else {
      console.log('Email sent: ' + info.response);
      res.send('Password reset email sent. Check your email for instructions.');
    }
  });
});

// Route for the password reset form with token
app.get('/reset-password/:token', (req, res) => {
  const token = req.params.token;
  res.sendFile(__dirname + '/reset-password-form.html');
});

// Handle password reset form submission with token
app.post('/reset-password/:token', async (req, res) => {
  const token = req.params.token;
  const { password } = req.body;

  // Find the user with the reset token
  const user = await User.findOne({ resetToken: token });

  if (user) {
    // Update the user's password
    const hashedPassword = bcrypt.hashSync(password, 10);
    await User.updateOne({ resetToken: token }, { $set: { password: hashedPassword, resetToken: '' } });
    res.send('Password reset successful! <a href="/login">Login</a>');
  } else {
    res.send('Invalid reset token. Please try again. <a href="/reset-password">Back to Reset Password</a>');
  }
});

// Route for logging out
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
