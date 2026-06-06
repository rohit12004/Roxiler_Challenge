const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// Helper to generate access token
const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRATION || '15m' }
  );
};

// Helper to generate refresh token
const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, jti: crypto.randomUUID() },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d' }
  );
};

class UserService {
  async findByEmail(email) {
    const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0] || null;
  }

  async findById(id) {
    const [rows] = await db.execute('SELECT id, name, email, address, role, created_at FROM users WHERE id = ?', [id]);
    return rows[0] || null;
  }

  async registerUser({ name, email, password, address, role }) {
    const existing = await this.findByEmail(email);
    if (existing) {
      throw new Error('EMAIL_IN_USE');
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const userId = crypto.randomUUID();

    await db.execute(
      'INSERT INTO users (id, name, email, password, address, role) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, name, email, hashedPassword, address, role]
    );

    return { id: userId, name, email, address, role };
  }

  async loginUser({ email, password, ip, userAgent }) {
    const user = await this.findByEmail(email);
    if (!user) {
      throw new Error('INVALID_CREDENTIALS');
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      throw new Error('INVALID_CREDENTIALS');
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Save refresh token hash and session info
    const tokenId = crypto.randomUUID();
    const refreshExpiryMs = 7 * 24 * 60 * 60 * 1000;
    const expiresAt = new Date(Date.now() + refreshExpiryMs);
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    await db.execute(
      'INSERT INTO refresh_tokens (id, user_id, token_hash, ip, user_agent, expires_at) VALUES (?, ?, ?, ?, ?, ?)',
      [tokenId, user.id, tokenHash, ip, userAgent, expiresAt]
    );

    return {
      accessToken,
      refreshToken,
      expiresAt,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        address: user.address,
        role: user.role
      }
    };
  }

  async refreshSession(refreshToken, ip, userAgent) {
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
      throw new Error('INVALID_TOKEN');
    }

    const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    // Query active session
    const [tokens] = await db.execute(
      'SELECT * FROM refresh_tokens WHERE token_hash = ? AND revoked = 0 AND expires_at > CURRENT_TIMESTAMP',
      [refreshTokenHash]
    );

    if (tokens.length === 0) {
      throw new Error('INVALID_TOKEN');
    }

    const session = tokens[0];
    const user = await this.findById(decoded.id);
    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }

    // Token rotation: Generate new access & refresh tokens
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);
    const newRefreshTokenHash = crypto.createHash('sha256').update(newRefreshToken).digest('hex');

    const refreshExpiryMs = 7 * 24 * 60 * 60 * 1000;
    const expiresAt = new Date(Date.now() + refreshExpiryMs);

    // Update existing session
    await db.execute(
      'UPDATE refresh_tokens SET token_hash = ?, expires_at = ?, ip = ?, user_agent = ? WHERE id = ?',
      [newRefreshTokenHash, expiresAt, ip || session.ip, userAgent || session.user_agent, session.id]
    );

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresAt,
      user
    };
  }

  async revokeSession(refreshToken) {
    if (refreshToken) {
      const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
      await db.execute(
        'UPDATE refresh_tokens SET revoked = 1 WHERE token_hash = ?',
        [refreshTokenHash]
      );
    }
  }

  async revokeAllSessions(refreshToken) {
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
      throw new Error('INVALID_TOKEN');
    }

    await db.execute(
      'UPDATE refresh_tokens SET revoked = 1 WHERE user_id = ? AND revoked = 0',
      [decoded.id]
    );
  }

  async updateUserPassword(userId, currentPassword, newPassword) {
    const [rows] = await db.execute('SELECT * FROM users WHERE id = ?', [userId]);
    const user = rows[0];

    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }

    const isPasswordCorrect = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordCorrect) {
      throw new Error('INVALID_PASSWORD');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await db.execute('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId]);
  }
}

module.exports = new UserService();
