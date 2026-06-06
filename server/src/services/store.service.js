const crypto = require('crypto');
const db = require('../config/db');
const redis = require('../config/redis');

// Helper to safely purge cache keys matching a scan pattern without blocking Redis
const purgeCachePattern = async (pattern) => {
  try {
    let cursor = '0';
    do {
      const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = nextCursor;
      if (keys.length > 0) {
        await redis.del(keys);
      }
    } while (cursor !== '0');
  } catch (err) {
    console.error('Redis purgeCachePattern Error:', err);
  }
};

class StoreService {
  async listStoresForUser(userId, { search } = {}) {
    const cacheKey = `user:${userId}:stores:search:${search || ''}`;
    
    // 1. Try fetching from Redis cache
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (err) {
      console.error('Redis read listStoresForUser error:', err);
    }

    // 2. Fetch from database if cache miss
    let query = `
      SELECT 
          u.id, 
          u.name, 
          u.address, 
          u.email,
          COALESCE(AVG(r_all.rating), 0) AS overall_rating,
          COALESCE(r_user.rating, 0) AS user_rating,
          COALESCE(r_user.review_text, '') AS user_review_text,
          COUNT(r_all.id) AS reviews_count
      FROM users u
      LEFT JOIN ratings r_all ON u.id = r_all.store_id
      LEFT JOIN ratings r_user ON u.id = r_user.store_id AND r_user.user_id = ?
      WHERE u.role = 'owner'
    `;
    const params = [userId];

    if (search) {
      query += " AND (u.name LIKE ? OR u.address LIKE ?)";
      const wild = `%${search}%`;
      params.push(wild, wild);
    }

    query += " GROUP BY u.id, u.name, u.address, u.email, r_user.rating, r_user.review_text ORDER BY u.name ASC";

    const [rows] = await db.execute(query, params);
    
    // Map database results to clean numbers
    const stores = rows.map(row => ({
      id: row.id,
      name: row.name,
      address: row.address,
      email: row.email,
      overallRating: Number(row.overall_rating),
      userRating: Number(row.user_rating),
      userReviewText: row.user_review_text,
      reviewsCount: row.reviews_count
    }));

    // 3. Cache the mapped results (TTL = 1 hour)
    try {
      await redis.setex(cacheKey, 3600, JSON.stringify(stores));
    } catch (err) {
      console.error('Redis write listStoresForUser error:', err);
    }

    return stores;
  }

  async upsertRating(userId, { storeId, rating, reviewText }) {
    // 1. Verify store exists and is a store
    const [storeRows] = await db.execute('SELECT id, role FROM users WHERE id = ?', [storeId]);
    const store = storeRows[0];

    if (!store || store.role !== 'owner') {
      throw new Error('STORE_NOT_FOUND');
    }

    let result;

    // 2. Check if user already rated this store
    const [existingRows] = await db.execute(
      'SELECT id FROM ratings WHERE user_id = ? AND store_id = ?',
      [userId, storeId]
    );

    if (existingRows.length > 0) {
      // Update existing rating
      await db.execute(
        'UPDATE ratings SET rating = ?, review_text = ? WHERE user_id = ? AND store_id = ?',
        [rating, reviewText || null, userId, storeId]
      );
      result = { id: existingRows[0].id, userId, storeId, rating, reviewText, updated: true };
    } else {
      // Insert new rating
      const ratingId = crypto.randomUUID();
      await db.execute(
        'INSERT INTO ratings (id, user_id, store_id, rating, review_text) VALUES (?, ?, ?, ?, ?)',
        [ratingId, userId, storeId, rating, reviewText || null]
      );
      result = { id: ratingId, userId, storeId, rating, reviewText, updated: false };
    }

    // 3. Invalidate Redis Caching
    try {
      // Clear store owner dashboard statistics cache
      await redis.del(`store:dashboard:${storeId}`);
      // Clear all cached store search lists for all users (overall ratings have changed)
      await purgeCachePattern('user:*:stores:*');
    } catch (err) {
      console.error('Redis cache invalidation error:', err);
    }

    return result;
  }

  async getStoreDashboardStats(storeId) {
    const cacheKey = `store:dashboard:${storeId}`;

    // 1. Try fetching from Redis cache
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (err) {
      console.error('Redis read getStoreDashboardStats error:', err);
    }

    // 2. Fetch from database if cache miss
    // Verify store exists and is indeed a store owner
    const [storeRows] = await db.execute('SELECT id, name, email, address, role FROM users WHERE id = ?', [storeId]);
    const store = storeRows[0];
    if (!store || store.role !== 'owner') {
      throw new Error('STORE_NOT_FOUND');
    }

    // Fetch rating statistics
    const [[statsRes]] = await db.execute(
      'SELECT COALESCE(AVG(rating), 0) AS average_rating, COUNT(*) AS total_reviews FROM ratings WHERE store_id = ?',
      [storeId]
    );

    // Fetch review list with reviewer details
    const [reviews] = await db.execute(
      `SELECT r.id, r.rating, r.review_text, r.created_at, u.name AS reviewer_name, u.email AS reviewer_email, u.address AS reviewer_address
       FROM ratings r
       JOIN users u ON r.user_id = u.id
       WHERE r.store_id = ?
       ORDER BY r.created_at DESC`,
      [storeId]
    );

    const stats = {
      store: {
        id: store.id,
        name: store.name,
        email: store.email,
        address: store.address
      },
      averageRating: statsRes ? Number(statsRes.average_rating) : 0,
      totalReviews: statsRes ? statsRes.total_reviews : 0,
      reviews: reviews.map(rev => ({
        id: rev.id,
        rating: Number(rev.rating),
        reviewText: rev.review_text || '',
        createdAt: rev.created_at,
        reviewerName: rev.reviewer_name,
        reviewerEmail: rev.reviewer_email,
        reviewerAddress: rev.reviewer_address
      }))
    };

    // 3. Cache stats in Redis (TTL = 1 hour)
    try {
      await redis.setex(cacheKey, 3600, JSON.stringify(stats));
    } catch (err) {
      console.error('Redis write getStoreDashboardStats error:', err);
    }

    return stats;
  }
}

module.exports = new StoreService();

