const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { User, PasswordResetToken, pool } = require('../models/index');
const { sendResetEmail } = require('../utils/mailer');

/* ── register ── */
exports.register = async (req, res) => {
  try {
    const { email, password, username } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: 'Email and password are required' });

    const existingUser = await User.findByEmail(email);
    if (existingUser)
      return res.status(400).json({ error: 'Email already registered' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create(email, hashedPassword, username || email.split('@')[0]);

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: { id: user.id, email: user.email, username: user.username, theme: user.theme },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

/* ── login ── */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: 'Email and password are required' });

    const user = await User.findByEmail(email);
    if (!user)
      return res.status(401).json({ error: 'Invalid credentials' });

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid)
      return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id:       user.id,
        email:    user.email,
        username: user.username,
        fullName: user.full_name,
        avatar:   user.avatar_url,
        theme:    user.theme,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

/* ── forgot password ── */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const user = await User.findByEmail(email);

    // Always return the same response to avoid leaking which emails are registered
    if (!user) {
      return res.json({ message: 'If email exists, reset link will be sent' });
    }

    const resetToken = uuidv4();
    const expiresAt  = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour

    await PasswordResetToken.create(user.id, resetToken, expiresAt);
    await sendResetEmail(email, resetToken);

    res.json({ message: 'If email exists, reset link will be sent' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
};

/* ── reset password (via email token link) ── */
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword)
      return res.status(400).json({ error: 'Token and new password are required' });

    const resetToken = await PasswordResetToken.findByToken(token);
    if (!resetToken)
      return res.status(400).json({ error: 'Invalid or expired reset token' });

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool.query(
      'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [hashedPassword, resetToken.user_id],
    );

    await PasswordResetToken.deleteByToken(token);

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
};

/* ── get profile ── */
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({
      user: {
        id:        user.id,
        email:     user.email,
        username:  user.username,
        fullName:  user.full_name,
        avatar:    user.avatar_url,
        theme:     user.theme,
        createdAt: user.created_at,
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
};

/* ── update profile ── */
exports.updateProfile = async (req, res) => {
  try {
    const { fullName, username, avatarUrl } = req.body;

    const updatedUser = await User.updateProfile(req.user.id, fullName, username, avatarUrl);

    res.json({
      message: 'Profile updated successfully',
      user: {
        id:       updatedUser.id,
        email:    updatedUser.email,
        username: updatedUser.username,
        fullName: updatedUser.full_name,
        avatar:   updatedUser.avatar_url,
        theme:    updatedUser.theme,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

/* ── update theme ── */
exports.updateTheme = async (req, res) => {
  try {
    const { theme } = req.body;

    if (!['light', 'dark'].includes(theme))
      return res.status(400).json({ error: 'Invalid theme' });

    const updatedUser = await User.updateTheme(req.user.id, theme);

    res.json({ message: 'Theme updated successfully', theme: updatedUser.theme });
  } catch (error) {
    console.error('Update theme error:', error);
    res.status(500).json({ error: 'Failed to update theme' });
  }
};

/* ── change password (authenticated) ── */
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword)
      return res.status(400).json({ error: 'Current and new passwords are required' });

    if (newPassword.length < 6)
      return res.status(400).json({ error: 'New password must be at least 6 characters' });

    const user = await User.findById(req.user.id);
    const valid = await bcrypt.compare(currentPassword, user.password);

    if (!valid)
      return res.status(400).json({ error: 'Current password is incorrect' });

    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.query(
      'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [hashed, req.user.id],
    );

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
};