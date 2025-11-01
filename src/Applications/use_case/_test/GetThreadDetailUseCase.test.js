const ThreadRepository = require('../../../Domains/threads/ThreadRepository');
const CommentRepository = require('../../../Domains/comments/CommentRepository');
const ReplyRepository = require('../../../Domains/replies/ReplyRepository');
const DetailThread = require('../../../Domains/threads/entities/DetailThread');
const DetailComment = require('../../../Domains/comments/entities/DetailComment');
const DetailReply = require('../../../Domains/replies/entities/DetailReply');
const GetThreadDetailsUseCase = require('../GetThreadDetailsUseCase');

describe('GetThreadDetailsUseCase', () => {
  it('should orchestrate the get thread details action correctly', async () => {
    // Arrange
    const threadId = 'thread-123';
    const useCasePayload = { threadId };

    const mockThread = {
      id: 'thread-123',
      title: 'sebuah thread',
      body: 'sebuah body thread',
      date: new Date('2021-08-08T07:19:09.775Z'),
      username: 'dicoding',
    };

    const mockComments = [
      {
        id: 'comment-123',
        username: 'johndoe',
        date: new Date('2021-08-08T07:22:33.555Z'),
        content: 'sebuah comment',
        is_delete: false,
      },
      {
        id: 'comment-456',
        username: 'dicoding',
        date: new Date('2021-08-08T07:26:21.338Z'),
        content: 'komentar ini telah dihapus',
        is_delete: true,
      },
    ];

    const mockReplies = [
      {
        id: 'reply-123',
        content: 'sebuah balasan',
        date: new Date('2021-08-08T07:59:48.766Z'),
        username: 'johndoe',
        is_delete: false,
        comment_id: 'comment-123',
      },
      {
        id: 'reply-456',
        content: 'balasan ini telah dihapus',
        date: new Date('2021-08-08T08:07:01.522Z'),
        username: 'dicoding',
        is_delete: true,
        comment_id: 'comment-456',
      },
    ];

    /** creating dependency of use case */
    const mockThreadRepository = new ThreadRepository();
    const mockCommentRepository = new CommentRepository();
    const mockReplyRepository = new ReplyRepository();

    /** mocking needed function */
    mockThreadRepository.verifyAvailableThread = jest.fn()
      .mockImplementation(() => Promise.resolve());
    mockThreadRepository.getThreadById = jest.fn()
      .mockImplementation(() => Promise.resolve(mockThread));
    mockCommentRepository.getCommentsByThreadId = jest.fn()
      .mockImplementation(() => Promise.resolve(mockComments));
    mockReplyRepository.getRepliesByCommentIds = jest.fn()
      .mockImplementation(() => Promise.resolve(mockReplies));

    /** creating use case instance */
    const getThreadDetailsUseCase = new GetThreadDetailsUseCase({
      threadRepository: mockThreadRepository,
      commentRepository: mockCommentRepository,
      replyRepository: mockReplyRepository,
    });

    // Action
    const threadDetails = await getThreadDetailsUseCase.execute(useCasePayload);

    // Assert
    expect(mockThreadRepository.verifyAvailableThread).toBeCalledWith(threadId);
    expect(mockThreadRepository.getThreadById).toBeCalledWith(threadId);
    expect(mockCommentRepository.getCommentsByThreadId).toBeCalledWith(threadId);
    expect(mockReplyRepository.getRepliesByCommentIds).toBeCalledWith(['comment-123', 'comment-456']);

    // Check Thread Details
    expect(threadDetails).toBeInstanceOf(DetailThread);
    expect(threadDetails.id).toEqual(mockThread.id);
    expect(threadDetails.title).toEqual(mockThread.title);
    expect(threadDetails.body).toEqual(mockThread.body);
    expect(threadDetails.date).toEqual(mockThread.date);
    expect(threadDetails.username).toEqual(mockThread.username);
    expect(threadDetails.comments).toHaveLength(2);

    // Check Comment 1
    const comment1 = threadDetails.comments[0];
    expect(comment1).toBeInstanceOf(DetailComment);
    expect(comment1.id).toEqual(mockComments[0].id);
    expect(comment1.username).toEqual(mockComments[0].username);
    expect(comment1.date).toEqual(mockComments[0].date);
    expect(comment1.content).toEqual(mockComments[0].content); // Not deleted
    expect(comment1.replies).toHaveLength(1);

    // Check Reply 1 (for Comment 1)
    const reply1 = comment1.replies[0];
    expect(reply1).toBeInstanceOf(DetailReply);
    expect(reply1.id).toEqual(mockReplies[0].id);
    expect(reply1.content).toEqual(mockReplies[0].content); // Not deleted
    expect(reply1.date).toEqual(mockReplies[0].date);
    expect(reply1.username).toEqual(mockReplies[0].username);

    // Check Comment 2 (Deleted)
    const comment2 = threadDetails.comments[1];
    expect(comment2).toBeInstanceOf(DetailComment);
    expect(comment2.id).toEqual(mockComments[1].id);
    expect(comment2.username).toEqual(mockComments[1].username);
    expect(comment2.date).toEqual(mockComments[1].date);
    expect(comment2.content).toEqual('**komentar telah dihapus**'); // Deleted
    expect(comment2.replies).toHaveLength(1);

    // Check Reply 2 (for Comment 2) (Deleted)
    const reply2 = comment2.replies[0];
    expect(reply2).toBeInstanceOf(DetailReply);
    expect(reply2.id).toEqual(mockReplies[1].id);
    expect(reply2.content).toEqual('**balasan telah dihapus**'); // Deleted
    expect(reply2.date).toEqual(mockReplies[1].date);
    expect(reply2.username).toEqual(mockReplies[1].username);
  });
});