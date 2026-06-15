const express = require('express');
const router = express.Router();

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/User');

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});
//"The register endpoint accepts name, email, and password. First it checks if the email already exists in MongoDB.
//  If not, the password is hashed using bcrypt before being stored. 
// A new user document is then created. 
// After successful registration, a JWT token containing the user's ID is generated and returned along with the user's basic information,
//  allowing the user to stay logged in immediately after signup."

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});
//The login endpoint accepts email and password. It first checks whether the user exists in MongoDB using the email.
//  Then bcrypt compares the entered password with the hashed password stored in the database.
//  If authentication succeeds, a JWT token containing the user's ID is generated and returned along with basic user details. 
// The token is later used to access protected routes."

router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');

    res.json(user);
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
});

module.exports = router;
//"The /me endpoint returns details of the currently authenticated user. 
// It extracts the JWT token from the Authorization header, verifies it using the secret key, retrieves the user from MongoDB using the decoded userId,
//  excludes the password field, and returns the user information. 
// If the token is missing or invalid, it returns a 401 Unauthorized response."








