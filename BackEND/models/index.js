const pool = require('../config/database');

/* ════════════════════════════════════════════════════════
   DATABASE INITIALISATION
════════════════════════════════════════════════════════ */
async function initializeDatabase() {
  try {
    // Users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id           SERIAL PRIMARY KEY,
        email        VARCHAR(255) UNIQUE NOT NULL,
        password     VARCHAR(255) NOT NULL,
        username     VARCHAR(255),
        full_name    VARCHAR(255),
        avatar_url   TEXT,
        theme        VARCHAR(20) DEFAULT 'light',
        created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Notes table
    // FIX: added `type` column (varchar, default 'note') so todo notes
    //      are persisted with type='todo' and the editor can detect them.
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notes (
        id          SERIAL PRIMARY KEY,
        user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title       VARCHAR(255) NOT NULL,
        content     TEXT,
        type        VARCHAR(20)  DEFAULT 'note',
        is_pinned   BOOLEAN      DEFAULT FALSE,
        is_archived BOOLEAN      DEFAULT FALSE,
        is_favorite BOOLEAN      DEFAULT FALSE,
        is_deleted  BOOLEAN      DEFAULT FALSE,
        color       VARCHAR(50)  DEFAULT '#FFFFFF',
        created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
        updated_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
        deleted_at  TIMESTAMP
      )
    `);

   

   

    // Password reset tokens table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id         SERIAL PRIMARY KEY,
        user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token      VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

/* ════════════════════════════════════════════════════════
   USER MODEL
════════════════════════════════════════════════════════ */
class User {
  static async create(email, password, username) {
    const result = await pool.query(
      `INSERT INTO users (email, password, username)
       VALUES ($1, $2, $3)
       RETURNING id, email, username, theme, created_at`,
      [email, password, username],
    );
    return result.rows[0];
  }

  static async findByEmail(email) {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0];
  }

  static async findById(id) {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async updateTheme(id, theme) {
    const result = await pool.query(
      `UPDATE users SET theme = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 RETURNING *`,
      [theme, id],
    );
    return result.rows[0];
  }

  static async updateProfile(id, fullName, username, avatarUrl) {
    const result = await pool.query(
      `UPDATE users
       SET full_name = $1, username = $2, avatar_url = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING id, email, full_name, username, avatar_url, theme`,
      [fullName, username, avatarUrl, id],
    );
    return result.rows[0];
  }
}

/* ════════════════════════════════════════════════════════
   NOTE MODEL
════════════════════════════════════════════════════════ */
class Note {
  /* ── create ──
     FIX: accepts `type` param and inserts it into the notes table        */
  static async create(userId, title, content, type = 'note') {
    const result = await pool.query(
      `INSERT INTO notes (user_id, title, content, type)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [userId, title, content, type],
    );
    return result.rows[0];
  }

  static async findById(id, userId) {
    const result = await pool.query(
      'SELECT * FROM notes WHERE id = $1 AND user_id = $2',
      [id, userId],
    );
    return result.rows[0];
  }

  static async findByUserId(userId, filters = {}) {
    let query  = 'SELECT * FROM notes WHERE user_id = $1 AND is_deleted = FALSE';
    let params = [userId];

    if (filters.pinned)   query += ' AND is_pinned = TRUE';
    if (filters.favorite) query += ' AND is_favorite = TRUE';

    // archived=true  -> only archived notes
    // archived=false -> exclude archived (All Notes, Pinned, Favorites tabs)
    // archived=undefined -> no filter
    if (filters.archived === true)       query += ' AND is_archived = TRUE';
    else if (filters.archived === false) query += ' AND is_archived = FALSE';

    if (filters.search) {
      params.push('%' + filters.search + '%');
      query += ` AND (title ILIKE $${params.length} OR content ILIKE $${params.length})`;
    }

    query += ' ORDER BY ';
    if      (filters.sortBy === 'date_asc')  query += 'created_at ASC';
    else if (filters.sortBy === 'date_desc') query += 'created_at DESC';
    else if (filters.sortBy === 'title')     query += 'title ASC';
    else                                     query += 'updated_at DESC';

    const result = await pool.query(query, params);
    return result.rows;
  }

  static async update(id, userId, title, content, color) {
    const result = await pool.query(
      `UPDATE notes
       SET title = $1, content = $2, color = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4 AND user_id = $5
       RETURNING *`,
      [title, content, color, id, userId],
    );
    return result.rows[0];
  }

  static async togglePin(id, userId) {
    const result = await pool.query(
      `UPDATE notes
       SET is_pinned = NOT is_pinned, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [id, userId],
    );
    return result.rows[0];
  }

  static async toggleArchive(id, userId) {
    const result = await pool.query(
      `UPDATE notes
       SET is_archived = NOT is_archived, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [id, userId],
    );
    return result.rows[0];
  }

  static async toggleFavorite(id, userId) {
    const result = await pool.query(
      `UPDATE notes
       SET is_favorite = NOT is_favorite, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [id, userId],
    );
    return result.rows[0];
  }

  static async softDelete(id, userId) {
    const result = await pool.query(
      `UPDATE notes
       SET is_deleted = TRUE, deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [id, userId],
    );
    return result.rows[0];
  }

  static async restore(id, userId) {
    const result = await pool.query(
      `UPDATE notes
       SET is_deleted = FALSE, deleted_at = NULL, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [id, userId],
    );
    return result.rows[0];
  }

  static async getDeleted(userId) {
    const result = await pool.query(
      `SELECT * FROM notes
       WHERE user_id = $1 AND is_deleted = TRUE
       ORDER BY deleted_at DESC`,
      [userId],
    );
    return result.rows;
  }

  static async permanentDelete(id, userId) {
    const result = await pool.query(
      'DELETE FROM notes WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId],
    );
    return result.rows[0];
  }
}

/* ════════════════════════════════════════════════════════
   PASSWORD RESET TOKEN MODEL
════════════════════════════════════════════════════════ */
class PasswordResetToken {
  static async create(userId, token, expiresAt) {
    const result = await pool.query(
      `INSERT INTO password_reset_tokens (user_id, token, expires_at)
       VALUES ($1, $2, $3) RETURNING *`,
      [userId, token, expiresAt],
    );
    return result.rows[0];
  }

  static async findByToken(token) {
    const result = await pool.query(
      `SELECT * FROM password_reset_tokens
       WHERE token = $1 AND expires_at > CURRENT_TIMESTAMP`,
      [token],
    );
    return result.rows[0];
  }

  static async deleteByToken(token) {
    await pool.query('DELETE FROM password_reset_tokens WHERE token = $1', [token]);
  }
}

module.exports = {
  initializeDatabase,
  User,
  Note,
  PasswordResetToken,
  pool,
};