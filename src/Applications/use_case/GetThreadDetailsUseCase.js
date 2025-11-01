const DetailThread = require('../../Domains/threads/entities/DetailThread');
const DetailComment = require('../../Domains/comments/entities/DetailComment');
const DetailReply = require('../../Domains/replies/entities/DetailReply');

class GetThreadDetailsUseCase {
  constructor({
    threadRepository,
    commentRepository,
    replyRepository,
  }) {
    this._threadRepository = threadRepository;
    this._commentRepository = commentRepository;
    this._replyRepository = replyRepository;
  }

  async execute(useCasePayload) {
    const { threadId } = useCasePayload;
    await this._threadRepository.verifyAvailableThread(threadId);

    const thread = await this._threadRepository.getThreadById(threadId);
    const comments = await this._commentRepository.getCommentsByThreadId(threadId);
    
    const detailThread = new DetailThread(thread);

    if (!comments.length) {
      return detailThread;
    }

    const commentIds = comments.map((comment) => comment.id);
    const replies = await this._replyRepository.getRepliesByCommentIds(commentIds);

    detailThread.comments = comments.map((comment) => {
      const detailComment = new DetailComment(comment);
      
      detailComment.replies = replies
        .filter((reply) => reply.comment_id === comment.id)
        .map((reply) => new DetailReply(reply));
        
      return detailComment;
    });

    return detailThread;
  }
}

module.exports = GetThreadDetailsUseCase;