const CommentsTableTestHelper = require('../../../../tests/CommentsTableTestHelper');
const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const pool = require('../../database/postgres/pool');
const NewComment = require('../../../Domains/comments/entities/NewComment');
const AddedComment = require('../../../Domains/comments/entities/AddedComment');
const CommentRepositoryPostgres = require('../CommentRepositoryPostgres');
const NotFoundError = require('../../../Commons/exceptions/NotFoundError');
const AuthorizationError = require('../../../Commons/exceptions/AuthorizationError');

describe('CommentRepositoryPostgres', () => {
  const userId = 'user-123';
  const threadId = 'thread-123';

  beforeAll(async () => {
    await UsersTableTestHelper.addUser({ id: userId, username: 'dicoding' });
    await ThreadsTableTestHelper.addThread({ id: threadId, owner: userId });
  });

  afterEach(async () => {
    await CommentsTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.addThread({ id: threadId, owner: userId });
  });

  afterAll(async () => {
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
    await pool.end();
  });

  describe('addComment function', () => {
    it('should persist new comment and return added comment correctly', async () => {
      // Arrange
      const newComment = new NewComment({
        content: 'sebuah comment',
        owner: userId,
        threadId,
      });
      const fakeIdGenerator = () => '123'; // stub!
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, fakeIdGenerator);

      // Action
      const addedComment = await commentRepositoryPostgres.addComment(newComment);

      // Assert
      const comments = await CommentsTableTestHelper.findCommentById('comment-123');
      expect(comments).toHaveLength(1);
      expect(addedComment).toStrictEqual(new AddedComment({
        id: 'comment-123',
        content: 'sebuah comment',
        owner: userId,
      }));
    });
  });

  describe('verifyAvailableCommentInThread function', () => {
    const commentId = 'comment-123';

    it('should throw NotFoundError when comment not available', async () => {
      // Arrange
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      // Action & Assert
      await expect(commentRepositoryPostgres.verifyAvailableCommentInThread(commentId, threadId))
        .rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError when comment is in another thread', async () => {
      // Arrange
      await ThreadsTableTestHelper.addThread({ id: 'thread-xxx', owner: userId });

      await CommentsTableTestHelper.addComment({ id: commentId, threadId: 'thread-xxx' });
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      // Action & Assert
      await expect(commentRepositoryPostgres.verifyAvailableCommentInThread(commentId, threadId))
        .rejects.toThrow(NotFoundError);
    });

    it('should not throw NotFoundError when comment available in thread', async () => {
      // Arrange
      await CommentsTableTestHelper.addComment({ id: commentId, threadId });
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      // Action & Assert
      await expect(commentRepositoryPostgres.verifyAvailableCommentInThread(commentId, threadId))
        .resolves.not.toThrow(NotFoundError);
    });
  });

  describe('verifyCommentOwner function', () => {
    const commentId = 'comment-123';

    it('should throw NotFoundError when comment not found', async () => {
      // Arrange
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      // Action & Assert
      await expect(commentRepositoryPostgres.verifyCommentOwner(commentId, userId))
        .rejects.toThrow(NotFoundError);
    });

    it('should throw AuthorizationError when owner is not the same', async () => {
      // Arrange
      await CommentsTableTestHelper.addComment({ id: commentId, owner: userId, threadId });
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      // Action & Assert
      await expect(commentRepositoryPostgres.verifyCommentOwner(commentId, 'user-xxx'))
        .rejects.toThrow(AuthorizationError);
    });

    it('should not throw error when owner is the same', async () => {
      // Arrange
      await CommentsTableTestHelper.addComment({ id: commentId, owner: userId, threadId });
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      // Action & Assert
      await expect(commentRepositoryPostgres.verifyCommentOwner(commentId, userId))
        .resolves.not.toThrow(AuthorizationError);
      await expect(commentRepositoryPostgres.verifyCommentOwner(commentId, userId))
        .resolves.not.toThrow(NotFoundError);
    });
  });

  describe('deleteComment function', () => {
    it('should update is_delete to true', async () => {
      // Arrange
      const commentId = 'comment-123';
      await CommentsTableTestHelper.addComment({ id: commentId, threadId });
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      // Action
      await commentRepositoryPostgres.deleteComment(commentId);

      // Assert
      const comments = await CommentsTableTestHelper.findCommentById(commentId);
      expect(comments).toHaveLength(1);
      expect(comments[0].is_delete).toEqual(true);
    });
  });

  describe('getCommentsByThreadId function', () => {
    it('should return comments for the thread ordered by date ascending', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-456', username: 'johndoe' });
      const commentDate1 = new Date('2023-01-01T00:00:00.000Z');
      const commentDate2 = new Date('2023-01-02T00:00:00.000Z');

      const content1 = 'Komentar A';
      const content2 = 'Komentar B';

      await CommentsTableTestHelper.addComment({
        id: 'comment-456', owner: userId, threadId, date: commentDate2, content: content2,
      });
      await CommentsTableTestHelper.addComment({
        id: 'comment-123', owner: userId, threadId, date: commentDate1, content: content1,
      });

      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      // Seed likes:
      // comment-123 liked by user-123 and user-456 (2 likes)
      // comment-456 liked by user-123 (1 like)
      await pool.query({
        text: 'INSERT INTO user_comment_likes(id, comment_id, user_id) VALUES ($1,$2,$3), ($4,$5,$6), ($7,$8,$9)',
        values: ['like-1', 'comment-123', 'user-123', 'like-2', 'comment-123', 'user-456', 'like-3', 'comment-456', 'user-123'],
      });

      // Action
      const comments = await commentRepositoryPostgres.getCommentsByThreadId(threadId);

      // Assert
      expect(comments).toHaveLength(2);

      // Assert comments[0]
      expect(comments[0].id).toEqual('comment-123');
      expect(comments[0].username).toEqual('dicoding');
      expect(comments[0].date).toEqual(commentDate1);
      expect(comments[0].content).toEqual(content1);
      expect(comments[0].is_delete).toEqual(false);
      expect(comments[0].likeCount).toEqual(2);

      // Assert comments[1]
      expect(comments[1].id).toEqual('comment-456');
      expect(comments[1].username).toEqual('dicoding');
      expect(comments[1].date).toEqual(commentDate2);
      expect(comments[1].content).toEqual(content2);
      expect(comments[1].is_delete).toEqual(false);
      expect(comments[1].likeCount).toEqual(1);
    });

    it('should return an empty array if thread has no comments', async () => {
      // Arrange
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      // Action
      const comments = await commentRepositoryPostgres.getCommentsByThreadId(threadId);

      // Assert
      expect(comments).toHaveLength(0);
    });
  });
});