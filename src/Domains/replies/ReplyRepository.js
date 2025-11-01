class ReplyRepository {
    async addReply(newReply) {
      throw new Error('REPLY_REPOSITORY.METHOD_NOT_IMPLEMENTED');
    }
  
    async verifyReplyOwner(replyId, owner) {
      throw new Error('REPLY_REPOSITORY.METHOD_NOT_IMPLEMENTED');
    }
  
    async deleteReply(replyId) {
      throw new Error('REPLY_REPOSITORY.METHOD_NOT_IMPLEMENTED');
    }
  
    async getRepliesByCommentIds(commentIds) {
      throw new Error('REPLY_REPOSITORY.METHOD_NOT_IMPLEMENTED');
    }
  
    async verifyAvailableReplyInComment(replyId, commentId) {
      throw new Error('REPLY_REPOSITORY.METHOD_NOT_IMPLEMENTED');
    }
  }
  
module.exports = ReplyRepository;