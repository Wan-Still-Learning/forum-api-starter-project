class LikeUnlikeCommentUseCase {
    constructor({ commentRepository, threadRepository }) {
      this._commentRepository = commentRepository;
      this._threadRepository = threadRepository;
    }
  
    async execute(useCasePayload) {
      const { threadId, commentId, userId } = useCasePayload;
  
      await this._threadRepository.verifyAvailableThread(threadId);
      await this._commentRepository.verifyAvailableCommentInThread(commentId, threadId);
  
      const isLiked = await this._commentRepository.checkLikeStatus(commentId, userId);
  
      if (isLiked) {
        await this._commentRepository.unlikeComment(commentId, userId);
      } else {
        await this._commentRepository.likeComment(commentId, userId);
      }
    }
  }
  
  module.exports = LikeUnlikeCommentUseCase;