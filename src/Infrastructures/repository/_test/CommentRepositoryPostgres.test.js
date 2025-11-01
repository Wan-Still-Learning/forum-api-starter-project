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
        .resolves.not.toThrowError();
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
      const commentDate1 = new Date('2023-01-01T00:00:00.000Z');
      const commentDate2 = new Date('2023-01-02T00:00:00.000Z');

      await CommentsTableTestHelper.addComment({
        id: 'comment-456', owner: userId, threadId, date: commentDate2,
      });
      await CommentsTableTestHelper.addComment({
        id: 'comment-123', owner: userId, threadId, date: commentDate1,
      });

      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      // Action
      const comments = await commentRepositoryPostgres.getCommentsByThreadId(threadId);

      // Assert
      expect(comments).toHaveLength(2);
      expect(comments[0].id).toEqual('comment-123');
      expect(comments[1].id).toEqual('comment-456');
      expect(comments[0].username).toEqual('dicoding');
      expect(comments[0].is_delete).toEqual(false);
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