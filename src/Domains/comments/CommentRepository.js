class CommentRepository {
    async addComment(newComment) {
      throw new Error('COMMENT_REPOSITORY.METHOD_NOT_IMPLEMENTED');
    }
  
    async verifyCommentOwner(commentId, owner) {
      throw new Error('COMMENT_REPOSITORY.METHOD_NOT_IMPLEMENTED');
    }
  
    async deleteComment(commentId) {
      throw new Error('COMMENT_REPOSITORY.METHOD_NOT_IMPLEMENTED');
    }
  
    async getCommentsByThreadId(threadId) {
      throw new Error('COMMENT_REPOSITORY.METHOD_NOT_IMPLEMENTED');
    }
  
    async verifyAvailableCommentInThread(commentId, threadId) {
      throw new Error('COMMENT_REPOSITORY.METHOD_NOT_IMPLEMENTED');
    }
    
    async checkLikeStatus(commentId, userId) {
      throw new Error('COMMENT_REPOSITORY.METHOD_NOT_IMPLEMENTED');
    }
  
    async likeComment(commentId, userId) {
      throw new Error('COMMENT_REPOSITORY.METHOD_NOT_IMPLEMENTED');
    }
  
    async unlikeComment(commentId, userId) {
      throw new Error('COMMENT_REPOSITORY.METHOD_NOT_IMPLEMENTED');
    }
  }
  
  module.exports = CommentRepository;