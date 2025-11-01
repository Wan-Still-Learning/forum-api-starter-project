const NewComment = require('../../Domains/comments/entities/NewComment');

class AddCommentUseCase {
  constructor({ commentRepository, threadRepository }) {
    this._commentRepository = commentRepository;
    this._threadRepository = threadRepository;
  }

  async execute(useCasePayload) {
    const newComment = new NewComment(useCasePayload);
    await this._threadRepository.verifyAvailableThread(newComment.threadId);
    return this._commentRepository.addComment(newComment);
  }
}

module.exports = AddCommentUseCase;