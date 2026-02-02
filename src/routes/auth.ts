import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { Secret } from 'jsonwebtoken';
import { env } from '../config/env';
import { User } from '../models/User';
import { signAccessToken, signRefreshToken } from '../middleware/auth';

const router = Router();

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, username } = req.body as {
      name?: string;
      email?: string;
      password?: string;
      username?: string;
    };

    if (!name || !email || !password || !username) {
      return res
        .status(400)
        .json({ message: 'Name, email, username and password are required' });
    }

    const normalizedUsername = String(username).trim().toLowerCase();

    const existing = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username: normalizedUsername }],
    });
    if (existing) {
      if (existing.email.toLowerCase() === email.toLowerCase()) {
        return res.status(409).json({ message: 'Email already in use' });
      }
      if (existing.username === normalizedUsername) {
        return res.status(409).json({ message: 'Username already taken' });
      }
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      username: normalizedUsername,
      password: hashed,
    });

    const accessToken = signAccessToken(user.id);
    const refreshToken = signRefreshToken(user.id);

    return res.status(201).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const accessToken = signAccessToken(user.id);
    const refreshToken = signRefreshToken(user.id);

    return res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Refresh access token using refresh token (so user stays logged in)
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body as { refreshToken?: string };
    if (!refreshToken || !env.refreshJwtSecret) {
      return res.status(400).json({ message: 'Refresh token required' });
    }

    const payload = jwt.verify(refreshToken, env.refreshJwtSecret as Secret) as { sub: string };
    const user = await User.findById(payload.sub).select('name email username');
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    const newAccessToken = signAccessToken(user.id);
    return res.json({
      accessToken: newAccessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
      },
    });
  } catch {
    return res.status(401).json({ message: 'Invalid or expired refresh token' });
  }
});

export default router;


