const AddedComment = require('../../Domains/comments/entities/AddedComment');
const CommentRepository = require('../../Domains/comments/CommentRepository');
const NotFoundError = require('../../Commons/exceptions/NotFoundError');
const AuthorizationError = require('../../Commons/exceptions/AuthorizationError');

class CommentRepositoryPostgres extends CommentRepository {
  constructor(pool, idGenerator) {
    super();
    this._pool = pool;
    this._idGenerator = idGenerator;
  }

  async addComment(newComment) {
    const { content, owner, threadId } = newComment;
    const id = `comment-${this._idGenerator()}`;

    const query = {
      text: 'INSERT INTO comments(id, content, owner, thread_id) VALUES($1, $2, $3, $4) RETURNING id, content, owner',
      values: [id, content, owner, threadId],
    };

    const result = await this._pool.query(query);

    return new AddedComment({ ...result.rows[0] });
  }

  async verifyAvailableCommentInThread(commentId, threadId) {
    const query = {
      text: 'SELECT id FROM comments WHERE id = $1 AND thread_id = $2 AND is_delete = false',
      values: [commentId, threadId],
    };

    const result = await this._pool.query(query);

    if (result.rowCount === 0) {
      throw new NotFoundError('komentar tidak ditemukan di thread ini');
    }
  }

  async verifyCommentOwner(commentId, owner) {
    const query = {
      text: 'SELECT owner FROM comments WHERE id = $1',
      values: [commentId],
    };

    const result = await this._pool.query(query);

    if (result.rowCount === 0) {
      throw new NotFoundError('komentar tidak ditemukan');
    }

    const comment = result.rows[0];
    if (comment.owner !== owner) {
      throw new AuthorizationError('anda tidak berhak mengakses resource ini');
    }
  }

  async deleteComment(commentId) {
    const query = {
      text: 'UPDATE comments SET is_delete = true WHERE id = $1',
      values: [commentId],
    };

    await this._pool.query(query);
  }

  async getCommentsByThreadId(threadId) {
    const query = {
      text: `
        SELECT
          c.id,
          u.username,
          c.date,
          c.content,
          c.is_delete,
          COALESCE(COUNT(ucl.id), 0)::int AS "likeCount"
        FROM comments c
        JOIN users u ON c.owner = u.id
        LEFT JOIN user_comment_likes ucl ON ucl.comment_id = c.id
        WHERE c.thread_id = $1
        GROUP BY c.id, u.username, c.date, c.content, c.is_delete
        ORDER BY c.date ASC
      `,
      values: [threadId],
    };

    const result = await this._pool.query(query);
    return result.rows;
  }

  async checkLikeStatus(commentId, userId) {
    const query = {
      text: 'SELECT id FROM user_comment_likes WHERE comment_id = $1 AND user_id = $2',
      values: [commentId, userId],
    };

    const result = await this._pool.query(query);
    return result.rowCount > 0;
  }

  async likeComment(commentId, userId) {
    const id = `like-${this._idGenerator()}`;
    const query = {
      text: 'INSERT INTO user_comment_likes(id, comment_id, user_id) VALUES($1, $2, $3)',
      values: [id, commentId, userId],
    };

    await this._pool.query(query);
  }

  async unlikeComment(commentId, userId) {
    const query = {
      text: 'DELETE FROM user_comment_likes WHERE comment_id = $1 AND user_id = $2',
      values: [commentId, userId],
    };

    await this._pool.query(query);
  }
}

module.exports = CommentRepositoryPostgres;