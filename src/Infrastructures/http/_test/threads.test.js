const pool = require('../../database/postgres/pool');
const container = require('../../container');
const createServer = require('../createServer');

// Import Test Helpers
const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const AuthenticationsTableTestHelper = require('../../../../tests/AuthenticationsTableTestHelper');
const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const CommentsTableTestHelper = require('../../../../tests/CommentsTableTestHelper');
const RepliesTableTestHelper = require('../../../../tests/RepliesTableTestHelper');

/**
 * Helper function to login a user and return the access token and user ID.
 * @param {object} server - Hapi server instance
 * @param {string} username - Username
 * @param {string} userId - User ID
 * @returns {object} { accessToken, userId }
 */
async function loginUser(server, username = 'dicoding', userId = 'user-123') {
  // Daftarkan pengguna melalui endpoint /users untuk memastikan password di-hash
  await server.inject({
    method: 'POST',
    url: '/users',
    payload: {
      username,
      password: 'secret',
      fullname: 'Dicoding Indonesia',
    },
  });

  // Login user
  const response = await server.inject({
    method: 'POST',
    url: '/authentications',
    payload: {
      username,
      password: 'secret',
    },
  });

  // Verifikasi bahwa login berhasil
  const responseJson = JSON.parse(response.payload);
  if (response.statusCode !== 201) {
    console.error('Login helper failed:', response.payload);
    throw new Error('Login helper failed');
  }

  const { data: { accessToken } } = responseJson;
  
  // Ambil ID pengguna dari tabel untuk memastikan ID yang benar
  const userResult = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
  const actualUserId = userResult.rows[0].id;

  return { accessToken, userId: actualUserId };
}

describe('/threads endpoint', () => {
  let server;
  let userA; // User "dicoding"
  let userB; // User "johndoe"

  beforeAll(async () => {
    server = await createServer(container);
    // Login user A (dicoding)
    userA = await loginUser(server, 'dicoding', 'user-123');
    // Login user B (johndoe)
    userB = await loginUser(server, 'johndoe', 'user-456');
  });

  afterEach(async () => {
    // Clean all tables in reverse order of dependency
    await RepliesTableTestHelper.cleanTable();
    await CommentsTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    // Clean user and auth tables
    await UsersTableTestHelper.cleanTable();
    await AuthenticationsTableTestHelper.cleanTable();
    await pool.end();
  });

  // Kriteria 1: Menambahkan Thread
  describe('when POST /threads', () => {
    it('should response 201 and persisted thread (Kriteria 1)', async () => {
      // Arrange
      const requestPayload = {
        title: 'sebuah thread',
        body: 'sebuah body thread',
      };

      // Action
      const response = await server.inject({
        method: 'POST',
        url: '/threads',
        payload: requestPayload,
        headers: {
          Authorization: `Bearer ${userA.accessToken}`,
        },
      });

      // Assert
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(201);
      expect(responseJson.status).toEqual('success');
      expect(responseJson.data.addedThread).toBeDefined();
      expect(responseJson.data.addedThread.id).toBeDefined();
      expect(responseJson.data.addedThread.title).toEqual(requestPayload.title);
      expect(responseJson.data.addedThread.owner).toEqual(userA.userId);
    });

    it('should response 401 when no authentication token provided', async () => {
      // Arrange
      const requestPayload = {
        title: 'sebuah thread',
        body: 'sebuah body thread',
      };

      // Action
      const response = await server.inject({
        method: 'POST',
        url: '/threads',
        payload: requestPayload,
        // No auth header
      });

      // Assert
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(401);
      expect(responseJson.error).toEqual('Unauthorized');
      expect(responseJson.message).toEqual('Missing authentication');
    });

    it('should response 400 when payload not contain needed property (Kriteria 1)', async () => {
      // Arrange
      const requestPayload = {
        title: 'sebuah thread',
        // body is missing
      };

      // Action
      const response = await server.inject({
        method: 'POST',
        url: '/threads',
        payload: requestPayload,
        headers: {
          Authorization: `Bearer ${userA.accessToken}`,
        },
      });

      // Assert
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(400);
      expect(responseJson.status).toEqual('fail');
      expect(responseJson.message).toEqual('tidak dapat membuat thread baru karena properti yang dibutuhkan tidak ada');
    });

    it('should response 400 when payload not meet data type specification (Kriteria 1)', async () => {
      // Arrange
      const requestPayload = {
        title: 'sebuah thread',
        body: 123, // should be string
      };

      // Action
      const response = await server.inject({
        method: 'POST',
        url: '/threads',
        payload: requestPayload,
        headers: {
          Authorization: `Bearer ${userA.accessToken}`,
        },
      });

      // Assert
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(400);
      expect(responseJson.status).toEqual('fail');
      expect(responseJson.message).toEqual('tidak dapat membuat thread baru karena tipe data tidak sesuai');
    });
  });

  // Kriteria 2 & 3: Add & Delete Comment
  describe('when POST /threads/{threadId}/comments (Kriteria 2)', () => {
    it('should response 201 and persisted comment', async () => {
      // Arrange
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: userA.userId });
      const requestPayload = {
        content: 'sebuah comment',
      };

      // Action
      const response = await server.inject({
        method: 'POST',
        url: '/threads/thread-123/comments',
        payload: requestPayload,
        headers: {
          Authorization: `Bearer ${userA.accessToken}`,
        },
      });

      // Assert
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(201);
      expect(responseJson.status).toEqual('success');
      expect(responseJson.data.addedComment).toBeDefined();
      expect(responseJson.data.addedComment.id).toBeDefined();
      expect(responseJson.data.addedComment.content).toEqual(requestPayload.content);
      expect(responseJson.data.addedComment.owner).toEqual(userA.userId);
    });

    it('should response 400 when payload not contain needed property', async () => {
      // Arrange
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: userA.userId });
      const requestPayload = {
        // content is missing
      };

      // Action
      const response = await server.inject({
        method: 'POST',
        url: '/threads/thread-123/comments',
        payload: requestPayload,
        headers: {
          Authorization: `Bearer ${userA.accessToken}`,
        },
      });

      // Assert
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(400);
      expect(responseJson.status).toEqual('fail');
      expect(responseJson.message).toEqual('tidak dapat membuat komentar baru karena properti yang dibutuhkan tidak ada');
    });

    it('should response 404 when thread is not found', async () => {
      // Arrange
      const requestPayload = {
        content: 'sebuah comment',
      };

      // Action
      const response = await server.inject({
        method: 'POST',
        url: '/threads/thread-xxx/comments', // Non-existent thread
        payload: requestPayload,
        headers: {
          Authorization: `Bearer ${userA.accessToken}`,
        },
      });

      // Assert
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(404);
      expect(responseJson.status).toEqual('fail');
      expect(responseJson.message).toEqual('thread tidak ditemukan');
    });
  });

  describe('when DELETE /threads/{threadId}/comments/{commentId} (Kriteria 3)', () => {
    it('should response 200 and soft delete comment', async () => {
      // Arrange
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: userA.userId });
      await CommentsTableTestHelper.addComment({ id: 'comment-123', threadId: 'thread-123', owner: userA.userId });

      // Action
      const response = await server.inject({
        method: 'DELETE',
        url: '/threads/thread-123/comments/comment-123',
        headers: {
          Authorization: `Bearer ${userA.accessToken}`,
        },
      });

      // Assert
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(200);
      expect(responseJson.status).toEqual('success');

      // Verify soft delete
      const comments = await CommentsTableTestHelper.findCommentById('comment-123');
      expect(comments).toHaveLength(1);
      expect(comments[0].is_delete).toEqual(true);
    });

    it('should response 403 when trying to delete other user comment', async () => {
      // Arrange
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: userA.userId });
      // userA (dicoding) adds a comment
      await CommentsTableTestHelper.addComment({ id: 'comment-123', threadId: 'thread-123', owner: userA.userId });

      // Action
      // userB (johndoe) tries to delete it
      const response = await server.inject({
        method: 'DELETE',
        url: '/threads/thread-123/comments/comment-123',
        headers: {
          Authorization: `Bearer ${userB.accessToken}`, // userB token
        },
      });

      // Assert
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(403);
      expect(responseJson.status).toEqual('fail');
      expect(responseJson.message).toEqual('anda tidak berhak mengakses resource ini');
    });

    it('should response 404 when thread is not found', async () => {
      // Arrange
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: userA.userId });
      await CommentsTableTestHelper.addComment({ id: 'comment-123', threadId: 'thread-123', owner: userA.userId });

      // Action
      const response = await server.inject({
        method: 'DELETE',
        url: '/threads/thread-xxx/comments/comment-123', // Non-existent thread
        headers: {
          Authorization: `Bearer ${userA.accessToken}`,
        },
      });

      // Assert
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(404);
      expect(responseJson.status).toEqual('fail');
      expect(responseJson.message).toEqual('thread tidak ditemukan');
    });

    it('should response 404 when comment is not found in thread', async () => {
      // Arrange
      await ThreadsTableTestHelper.addThread({ id: 'thread-1GE-123', owner: userA.userId });

      // Action
      const response = await server.inject({
        method: 'DELETE',
        url: '/threads/thread-123/comments/comment-xxx', // Non-existent comment
        headers: {
          Authorization: `Bearer ${userA.accessToken}`,
        },
      });

      // Assert
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(404);
      expect(responseJson.status).toEqual('fail');
      expect(responseJson.message).toEqual('thread tidak ditemukan');
    });
  });

  // Opsional 1 & 2: Add & Delete Reply
  describe('when POST /threads/{threadId}/comments/{commentId}/replies (Opsional 1)', () => {
    it('should response 201 and persisted reply', async () => {
      // Arrange
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: userA.userId });
      await CommentsTableTestHelper.addComment({ id: 'comment-123', threadId: 'thread-123', owner: userA.userId });
      const requestPayload = {
        content: 'sebuah balasan',
      };

      // Action
      const response = await server.inject({
        method: 'POST',
        url: '/threads/thread-123/comments/comment-123/replies',
        payload: requestPayload,
        headers: {
          Authorization: `Bearer ${userB.accessToken}`,
        },
      });

      // Assert
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(201);
      expect(responseJson.status).toEqual('success');
      expect(responseJson.data.addedReply).toBeDefined();
      expect(responseJson.data.addedReply.id).toBeDefined();
      expect(responseJson.data.addedReply.content).toEqual(requestPayload.content);
      expect(responseJson.data.addedReply.owner).toEqual(userB.userId);
    });

    it('should response 400 when payload has wrong data type', async () => {
      // Arrange
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: userA.userId });
      await CommentsTableTestHelper.addComment({ id: 'comment-123', threadId: 'thread-123', owner: userA.userId });
      const requestPayload = {
        content: 123, // should be string
      };

      // Action
      const response = await server.inject({
        method: 'POST',
        url: '/threads/thread-123/comments/comment-123/replies',
        payload: requestPayload,
        headers: {
          Authorization: `Bearer ${userB.accessToken}`,
        },
      });

      // Assert
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(400);
      expect(responseJson.status).toEqual('fail');
      expect(responseJson.message).toEqual('tidak dapat membuat balasan baru karena tipe data tidak sesuai');
    });

    it('should response 404 when comment is not found', async () => {
      // Arrange
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: userA.userId });
      const requestPayload = {
        content: 'sebuah balasan',
      };

      // Action
      const response = await server.inject({
        method: 'POST',
        url: '/threads/thread-123/comments/comment-xxx/replies', // Non-existent comment
        payload: requestPayload,
        headers: {
          Authorization: `Bearer ${userB.accessToken}`,
        },
      });

      // Assert
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(404);
      expect(responseJson.status).toEqual('fail');
      expect(responseJson.message).toEqual('komentar tidak ditemukan di thread ini');
    });
  });

  describe('when DELETE /threads/{threadId}/comments/{commentId}/replies/{replyId} (Opsional 2)', () => {
    it('should response 200 and soft delete reply', async () => {
      // Arrange
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: userA.userId });
      await CommentsTableTestHelper.addComment({ id: 'comment-123', threadId: 'thread-123', owner: userA.userId });
      await RepliesTableTestHelper.addReply({ id: 'reply-123', commentId: 'comment-123', owner: userA.userId }); // userA adds reply

      // Action
      const response = await server.inject({
        method: 'DELETE',
        url: '/threads/thread-123/comments/comment-123/replies/reply-123',
        headers: {
          Authorization: `Bearer ${userA.accessToken}`, // userA deletes reply
        },
      });

      // Assert
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(200);
      expect(responseJson.status).toEqual('success');

      // Verify soft delete
      const replies = await RepliesTableTestHelper.findReplyById('reply-123');
      expect(replies).toHaveLength(1);
      expect(replies[0].is_delete).toEqual(true);
    });

    it('should response 403 when trying to delete other user reply', async () => {
      // Arrange
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: userA.userId });
      await CommentsTableTestHelper.addComment({ id: 'comment-123', threadId: 'thread-123', owner: userA.userId });
      await RepliesTableTestHelper.addReply({ id: 'reply-123', commentId: 'comment-123', owner: userA.userId }); // userA adds reply

      // Action
      const response = await server.inject({
        method: 'DELETE',
        url: '/threads/thread-123/comments/comment-123/replies/reply-123',
        headers: {
          Authorization: `Bearer ${userB.accessToken}`, // userB tries to delete
        },
      });

      // Assert
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(403);
      expect(responseJson.status).toEqual('fail');
      expect(responseJson.message).toEqual('anda tidak berhak mengakses resource ini');
    });

    it('should response 404 when reply is not found', async () => {
      // Arrange
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: userA.userId });
      await CommentsTableTestHelper.addComment({ id: 'comment-123', threadId: 'thread-123', owner: userA.userId });

      // Action
      const response = await server.inject({
        method: 'DELETE',
        url: '/threads/thread-123/comments/comment-123/replies/reply-xxx', // Non-existent reply
        headers: {
          Authorization: `Bearer ${userA.accessToken}`,
        },
      });

      // Assert
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(404);
      expect(responseJson.status).toEqual('fail');
      expect(responseJson.message).toEqual('balasan tidak ditemukan di komentar ini');
    });
  });

  // Kriteria 4: Melihat Detail Thread
  describe('when GET /threads/{threadId} (Kriteria 4)', () => {
    it('should response 404 when thread is not found', async () => {
      // Action
      const response = await server.inject({
        method: 'GET',
        url: '/threads/thread-xxx', // Non-existent thread
      });

      // Assert
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(404);
      expect(responseJson.status).toEqual('fail');
      expect(responseJson.message).toEqual('thread tidak ditemukan');
    });

    it('should response 200 and return thread details with comments and replies correctly', async () => {
      // Arrange
      const threadDate = new Date('2023-01-01T00:00:00.000Z');
      const commentDate1 = new Date('2023-01-01T00:01:00.000Z');
      const commentDate2 = new Date('2023-01-01T00:02:00.000Z');
      const replyDate1 = new Date('2023-01-01T00:03:00.000Z');
      const replyDate2 = new Date('2023-01-01T00:04:00.000Z');

      // Add Data (userA = dicoding, userB = johndoe)
      await ThreadsTableTestHelper.addThread({
        id: 'thread-123', owner: userA.userId, date: threadDate, title: 'Judul Thread', body: 'Body Thread',
      });
      // Comment 1 (Not deleted) by userB
      await CommentsTableTestHelper.addComment({
        id: 'comment-123', threadId: 'thread-123', owner: userB.userId, date: commentDate1, content: 'Komentar A',
      });
      // Comment 2 (Deleted) by userA
      await CommentsTableTestHelper.addComment({
        id: 'comment-456', threadId: 'thread-123', owner: userA.userId, date: commentDate2, content: 'Komentar B', isDelete: true,
      });
      // Reply 1 (for Comment 1, Not deleted) by userA
      await RepliesTableTestHelper.addReply({
        id: 'reply-123', commentId: 'comment-123', owner: userA.userId, date: replyDate1, content: 'Balasan A',
      });
      // Reply 2 (for Comment 1, Deleted) by userB
      await RepliesTableTestHelper.addReply({
        id: 'reply-456', commentId: 'comment-123', owner: userB.userId, date: replyDate2, content: 'Balasan B', isDelete: true,
      });

      // Action
      const response = await server.inject({
        method: 'GET',
        url: '/threads/thread-123',
      });

      // Assert
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(200);
      expect(responseJson.status).toEqual('success');

      // Assert Thread
      const { thread } = responseJson.data;
      expect(thread).toBeDefined();
      expect(thread.id).toEqual('thread-123');
      expect(thread.title).toEqual('Judul Thread');
      expect(thread.body).toEqual('Body Thread');
      expect(thread.username).toEqual('dicoding'); // userA
      expect(thread.date).toEqual(threadDate.toISOString());

      // Assert Comments (Sorted by date ASC)
      expect(thread.comments).toHaveLength(2);
      const [comment1, comment2] = thread.comments;

      // Assert Comment 1 (Not deleted)
      expect(comment1.id).toEqual('comment-123');
      expect(comment1.username).toEqual('johndoe'); // userB
      expect(comment1.date).toEqual(commentDate1.toISOString());
      expect(comment1.content).toEqual('Komentar A');

      // Assert Comment 2 (Deleted)
      expect(comment2.id).toEqual('comment-456');
      expect(comment2.username).toEqual('dicoding'); // userA
      expect(comment2.date).toEqual(commentDate2.toISOString());
      expect(comment2.content).toEqual('**komentar telah dihapus**'); // Kriteria 4

      // Assert Replies (Sorted by date ASC)
      expect(comment1.replies).toHaveLength(2);
      const [reply1, reply2] = comment1.replies;
      expect(comment2.replies).toHaveLength(0); // Comment 2 has no replies

      // Assert Reply 1 (Not deleted)
      expect(reply1.id).toEqual('reply-123');
      expect(reply1.username).toEqual('dicoding'); // userA
      expect(reply1.date).toEqual(replyDate1.toISOString());
      expect(reply1.content).toEqual('Balasan A');

      // Assert Reply 2 (Deleted)
      expect(reply2.id).toEqual('reply-456');
      expect(reply2.username).toEqual('johndoe'); // userB
      expect(reply2.date).toEqual(replyDate2.toISOString());
      expect(reply2.content).toEqual('**balasan telah dihapus**'); // Opsional 1
    });
  });
});