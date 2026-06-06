const bcrypt = require('bcrypt');
const crypto = require('crypto');
const db = require('../config/db');

class AdminService {
  async getDashboardStats() {
    const [[usersRes]] = await db.execute("SELECT COUNT(*) AS count FROM users WHERE role IN ('user', 'admin')");
    const [[storesRes]] = await db.execute("SELECT COUNT(*) AS count FROM users WHERE role = 'owner'");
    const [[ratingsRes]] = await db.execute("SELECT COUNT(*) AS count FROM ratings");

    return {
      totalUsers: usersRes ? usersRes.count : 0,
      totalStores: storesRes ? storesRes.count : 0,
      totalRatings: ratingsRes ? ratingsRes.count : 0
    };
  }

  async createUser({ name, email, password, address, role }) {
    // Check if email already in use
    const [existing] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
    if (existing && existing.length > 0) {
      throw new Error('EMAIL_IN_USE');
    }

    let finalPassword = password;
    let temporaryPassword;
    if (!finalPassword || finalPassword.trim() === '') {
      temporaryPassword = `Temp_${crypto.randomBytes(4).toString('hex')}!`;
      finalPassword = temporaryPassword;
    }

    const hashedPassword = await bcrypt.hash(finalPassword, 12);
    const userId = crypto.randomUUID();

    await db.execute(
      'INSERT INTO users (id, name, email, password, address, role) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, name, email, hashedPassword, address, role]
    );

    return { id: userId, name, email, address, role, temporaryPassword };
  }

  async resetUserPassword(userId) {
    const [rows] = await db.execute('SELECT * FROM users WHERE id = ?', [userId]);
    const user = rows[0];

    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }

    const temporaryPassword = `Temp_${crypto.randomBytes(4).toString('hex')}!`;
    const hashedPassword = await bcrypt.hash(temporaryPassword, 12);

    await db.execute('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId]);
    await db.execute('UPDATE refresh_tokens SET revoked = 1 WHERE user_id = ? AND revoked = 0', [userId]);

    return temporaryPassword;
  }

  async listUsers({ search, role }) {
    let query = "SELECT id, name, email, address, role, created_at FROM users WHERE 1=1";
    const params = [];

    if (role && role !== 'all') {
      query += " AND role = ?";
      params.push(role);
    } else {
      query += " AND role IN ('user', 'admin')";
    }

    if (search) {
      query += " AND (name LIKE ? OR email LIKE ? OR address LIKE ?)";
      const wild = `%${search}%`;
      params.push(wild, wild, wild);
    }

    query += " ORDER BY created_at DESC";

    const [rows] = await db.execute(query, params);
    return rows;
  }

  async listStores({ search }) {
    let query = `
      SELECT u.id, u.name, u.email, u.address, u.role, u.created_at,
             COALESCE(AVG(r.rating), 0) AS rating,
             COUNT(r.id) AS reviews_count
      FROM users u
      LEFT JOIN ratings r ON u.id = r.store_id
      WHERE u.role = 'owner'
    `;
    const params = [];

    if (search) {
      query += " AND (u.name LIKE ? OR u.email LIKE ? OR u.address LIKE ?)";
      const wild = `%${search}%`;
      params.push(wild, wild, wild);
    }

    query += " GROUP BY u.id, u.name, u.email, u.address, u.role, u.created_at ORDER BY u.created_at DESC";

    const [rows] = await db.execute(query, params);
    return rows;
  }

  async getUserDetails(id) {
    const [userRows] = await db.execute('SELECT id, name, email, address, role, created_at FROM users WHERE id = ?', [id]);
    const user = userRows[0];

    if (!user) {
      return null;
    }

    if (user.role === 'owner') {
      // Fetch rating statistics
      const [[statsRes]] = await db.execute(
        'SELECT COALESCE(AVG(rating), 0) AS average_rating, COUNT(*) AS total_reviews FROM ratings WHERE store_id = ?',
        [id]
      );

      // Fetch review list with reviewer names
      const [reviews] = await db.execute(
        `SELECT r.id, r.rating, r.review_text, r.created_at, u.name AS reviewer_name, u.email AS reviewer_email 
         FROM ratings r 
         JOIN users u ON r.user_id = u.id 
         WHERE r.store_id = ? 
         ORDER BY r.created_at DESC`,
        [id]
      );

      return {
        ...user,
        averageRating: statsRes ? Number(statsRes.average_rating) : 0,
        totalReviews: statsRes ? statsRes.total_reviews : 0,
        reviews: reviews
      };
    }

    return user;
  }
}

module.exports = new AdminService();
