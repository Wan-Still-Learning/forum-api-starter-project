const RepliesTableTestHelper = require('../../../../tests/RepliesTableTestHelper');
const CommentsTableTestHelper = require('../../../../tests/CommentsTableTestHelper');
const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const pool = require('../../database/postgres/pool');
const NewReply = require('../../../Domains/replies/entities/NewReply');
const AddedReply = require('../../../Domains/replies/entities/AddedReply');
const ReplyRepositoryPostgres = require('../ReplyRepositoryPostgres');
const NotFoundError = require('../../../Commons/exceptions/NotFoundError');
const AuthorizationError = require('../../../Commons/exceptions/AuthorizationError');

describe('ReplyRepositoryPostgres', () => {
  const userId = 'user-123';
  const threadId = 'thread-123';
  const commentId = 'comment-123';

  beforeAll(async () => {
    await UsersTableTestHelper.addUser({ id: userId, username: 'dicoding' });
    await ThreadsTableTestHelper.addThread({ id: threadId, owner: userId });
    await CommentsTableTestHelper.addComment({ id: commentId, threadId, owner: userId });
  });

  afterEach(async () => {
    await RepliesTableTestHelper.cleanTable();
    await CommentsTableTestHelper.cleanTable();
    await CommentsTableTestHelper.addComment({ id: commentId, threadId, owner: userId });
  });

  afterAll(async () => {
    await CommentsTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
    await pool.end();
  });

  describe('addReply function', () => {
    it('should persist new reply and return added reply correctly', async () => {
      // Arrange
      const newReply = new NewReply({
        content: 'sebuah balasan',
        owner: userId,
        commentId,
      });
      const fakeIdGenerator = () => '123'; // stub!
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, fakeIdGenerator);

      // Action
      const addedReply = await replyRepositoryPostgres.addReply(newReply);

      // Assert
      const replies = await RepliesTableTestHelper.findReplyById('reply-123');
      expect(replies).toHaveLength(1);
      expect(addedReply).toStrictEqual(new AddedReply({
        id: 'reply-123',
        content: 'sebuah balasan',
        owner: userId,
      }));
    });
  });

  describe('verifyAvailableReplyInComment function', () => {
    const replyId = 'reply-123';

    it('should throw NotFoundError when reply not available', async () => {
      // Arrange
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {});

      // Action & Assert
      await expect(replyRepositoryPostgres.verifyAvailableReplyInComment(replyId, commentId))
        .rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError when reply is in another comment', async () => {
      // Arrange
      await CommentsTableTestHelper.addComment({ id: 'comment-xxx', threadId, owner: userId });

      await RepliesTableTestHelper.addReply({ id: replyId, commentId: 'comment-xxx' });
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {});

      // Action & Assert
      await expect(replyRepositoryPostgres.verifyAvailableReplyInComment(replyId, commentId))
        .rejects.toThrow(NotFoundError);
    });

    it('should not throw NotFoundError when reply available in comment', async () => {
      // Arrange
      await RepliesTableTestHelper.addReply({ id: replyId, commentId });
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {});

      // Action & Assert
      await expect(replyRepositoryPostgres.verifyAvailableReplyInComment(replyId, commentId))
        .resolves.not.toThrow(NotFoundError);
    });
  });

  describe('verifyReplyOwner function', () => {
    const replyId = 'reply-123';

    it('should throw NotFoundError when reply not found', async () => {
      // Arrange
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {});

      // Action & Assert
      await expect(replyRepositoryPostgres.verifyReplyOwner(replyId, userId))
        .rejects.toThrow(NotFoundError);
    });

    it('should throw AuthorizationError when owner is not the same', async () => {
      // Arrange
      await RepliesTableTestHelper.addReply({ id: replyId, owner: userId, commentId });
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {});

      // Action & Assert
      await expect(replyRepositoryPostgres.verifyReplyOwner(replyId, 'user-xxx'))
        .rejects.toThrow(AuthorizationError);
    });

    it('should not throw error when owner is the same', async () => {
      // Arrange
      await RepliesTableTestHelper.addReply({ id: replyId, owner: userId, commentId });
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {});

      // Action & Assert
      await expect(replyRepositoryPostgres.verifyReplyOwner(replyId, userId))
        .resolves.not.toThrowError();
    });
  });

  describe('deleteReply function', () => {
    it('should update is_delete to true', async () => {
      // Arrange
      const replyId = 'reply-123';
      await RepliesTableTestHelper.addReply({ id: replyId, commentId });
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {});

      // Action
      await replyRepositoryPostgres.deleteReply(replyId);

      // Assert
      const replies = await RepliesTableTestHelper.findReplyById(replyId);
      expect(replies).toHaveLength(1);
      expect(replies[0].is_delete).toEqual(true);
    });
  });

  describe('getRepliesByCommentIds function', () => {
    it('should return replies for the comments ordered by date ascending', async () => {
      // Arrange
      const replyDate1 = new Date('2023-01-01T00:00:00.000Z');
      const replyDate2 = new Date('2023-01-02T00:00:00.000Z');

      await RepliesTableTestHelper.addReply({
        id: 'reply-456', owner: userId, commentId, date: replyDate2,
      });
      await RepliesTableTestHelper.addReply({
        id: 'reply-123', owner: userId, commentId, date: replyDate1,
      });

      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {});

      // Action
      const replies = await replyRepositoryPostgres.getRepliesByCommentIds([commentId]);

      // Assert
      expect(replies).toHaveLength(2);
      expect(replies[0].id).toEqual('reply-123');
      expect(replies[1].id).toEqual('reply-456');
      expect(replies[0].username).toEqual('dicoding');
      expect(replies[0].is_delete).toEqual(false);
    });

    it('should return an empty array if no commentIds provided', async () => {
      // Arrange
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {});

      // Action
      const replies = await replyRepositoryPostgres.getRepliesByCommentIds([]);

      // Assert
      expect(replies).toHaveLength(0);
    });
  });
});