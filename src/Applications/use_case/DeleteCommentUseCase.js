class DeleteCommentUseCase {
    constructor({ commentRepository, threadRepository }) {
      this._commentRepository = commentRepository;
      this._threadRepository = threadRepository;
    }
  
    async execute(useCasePayload) {
      const { threadId, commentId, owner } = useCasePayload;
      await this._threadRepository.verifyAvailableThread(threadId);
      await this._commentRepository.verifyAvailableCommentInThread(commentId, threadId);
      await this._commentRepository.verifyCommentOwner(commentId, owner);
      await this._commentRepository.deleteComment(commentId);
    }
  }
  
  module.exports = DeleteCommentUseCase;