const LikeUnlikeCommentUseCase = require('../LikeUnlikeCommentUseCase');
const CommentRepository = require('../../../Domains/comments/CommentRepository');
const ThreadRepository = require('../../../Domains/threads/ThreadRepository');

describe('LikeUnlikeCommentUseCase', () => {
  const useCasePayload = {
    threadId: 'thread-123',
    commentId: 'comment-123',
    userId: 'user-123',
  };

  const createUseCase = ({
    isLikedReturn = false,
  } = {}) => {
    const mockCommentRepository = new CommentRepository();
    const mockThreadRepository = new ThreadRepository();

    mockThreadRepository.verifyAvailableThread = jest.fn(() => Promise.resolve());
    mockCommentRepository.verifyAvailableCommentInThread = jest.fn(() => Promise.resolve());
    mockCommentRepository.checkLikeStatus = jest.fn(() => Promise.resolve(isLikedReturn));
    mockCommentRepository.likeComment = jest.fn(() => Promise.resolve());
    mockCommentRepository.unlikeComment = jest.fn(() => Promise.resolve());

    const useCase = new LikeUnlikeCommentUseCase({
      commentRepository: mockCommentRepository,
      threadRepository: mockThreadRepository,
    });

    return {
      useCase,
      mockCommentRepository,
      mockThreadRepository,
    };
  };

  it('should orchestrate the unlike flow when comment already liked', async () => {
    const { useCase, mockCommentRepository, mockThreadRepository } = createUseCase({ isLikedReturn: true });

    await useCase.execute(useCasePayload);

    expect(mockThreadRepository.verifyAvailableThread).toHaveBeenCalledWith(useCasePayload.threadId);
    expect(mockCommentRepository.verifyAvailableCommentInThread)
      .toHaveBeenCalledWith(useCasePayload.commentId, useCasePayload.threadId);
    expect(mockCommentRepository.checkLikeStatus)
      .toHaveBeenCalledWith(useCasePayload.commentId, useCasePayload.userId);
    expect(mockCommentRepository.unlikeComment)
      .toHaveBeenCalledWith(useCasePayload.commentId, useCasePayload.userId);
    expect(mockCommentRepository.likeComment).not.toHaveBeenCalled();
  });

  it('should orchestrate the like flow when comment not yet liked', async () => {
    const { useCase, mockCommentRepository, mockThreadRepository } = createUseCase({ isLikedReturn: false });

    await useCase.execute(useCasePayload);

    expect(mockThreadRepository.verifyAvailableThread).toHaveBeenCalledWith(useCasePayload.threadId);
    expect(mockCommentRepository.verifyAvailableCommentInThread)
      .toHaveBeenCalledWith(useCasePayload.commentId, useCasePayload.threadId);
    expect(mockCommentRepository.checkLikeStatus)
      .toHaveBeenCalledWith(useCasePayload.commentId, useCasePayload.userId);
    expect(mockCommentRepository.likeComment)
      .toHaveBeenCalledWith(useCasePayload.commentId, useCasePayload.userId);
    expect(mockCommentRepository.unlikeComment).not.toHaveBeenCalled();
  });
});

