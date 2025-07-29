import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Generate tokens
const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: '15d' }
  );
  
  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '5w' }
  );
  
  return { accessToken, refreshToken };
};

// Register
router.post('/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if user exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({ 
        error: existingUser.email === email ? 'Email already exists' : 'Username already exists'
      });
    }

    // Create user
    const user = new User({ username, email, password });
    await user.save();

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user._id);
    
    // Save refresh token
    user.refreshTokens.push({ token: refreshToken });
    await user.save();

    res.status(201).json({
      message: 'User created successfully',
      user: user.toJSON(),
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user._id);
    
    // Save refresh token
    user.refreshTokens.push({ token: refreshToken });
    await user.save();

    res.json({
      message: 'Login successful',
      user: user.toJSON(),
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Refresh token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Check if refresh token exists
    const tokenExists = user.refreshTokens.some(t => t.token === refreshToken);
    if (!tokenExists) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id);
    
    // Remove old refresh token and add new one
    user.refreshTokens = user.refreshTokens.filter(t => t.token !== refreshToken);
    user.refreshTokens.push({ token: newRefreshToken });
    await user.save();

    res.json({
      accessToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// Logout
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const user = req.user;

    if (refreshToken) {
      // Remove specific refresh token
      await User.findByIdAndUpdate(user._id, {
        $pull: { refreshTokens: { token: refreshToken } }
      });
    } else {
      // Remove all refresh tokens
      await User.findByIdAndUpdate(user._id, {
        $set: { refreshTokens: [] }
      });
    }

    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Verify token
router.get('/verify', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

export default router;