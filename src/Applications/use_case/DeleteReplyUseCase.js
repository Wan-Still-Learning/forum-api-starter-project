class DeleteReplyUseCase {
    constructor({ replyRepository, commentRepository, threadRepository }) {
      this._replyRepository = replyRepository;
      this._commentRepository = commentRepository;
      this._threadRepository = threadRepository;
    }
  
    async execute(useCasePayload) {
      const {
        threadId, commentId, replyId, owner,
      } = useCasePayload;
      await this._threadRepository.verifyAvailableThread(threadId);
      await this._commentRepository.verifyAvailableCommentInThread(commentId, threadId);
      await this._replyRepository.verifyAvailableReplyInComment(replyId, commentId);
      await this._replyRepository.verifyReplyOwner(replyId, owner);
      await this._replyRepository.deleteReply(replyId);
    }
  }
  
module.exports = DeleteReplyUseCase;