class DetailComment {
    constructor(payload) {
      this._verifyPayload(payload);
  
      const {
        id, username, date, content, is_delete: isDelete, likeCount,
      } = payload;
  
      this.id = id;
      this.username = username;
      this.date = date;
      this.content = isDelete ? '**komentar telah dihapus**' : content;
      this.likeCount = likeCount;
      this.replies = [];
    }
  
    _verifyPayload({
      id, username, date, content, is_delete, likeCount,
    }) {
      if (!id || !username || !date || !content || is_delete === undefined || likeCount === undefined) {
        throw new Error('DETAIL_COMMENT.NOT_CONTAIN_NEEDED_PROPERTY');
      }
  
      if (typeof id !== 'string' || typeof username !== 'string' || !(date instanceof Date) || typeof content !== 'string' || typeof is_delete !== 'boolean' || typeof likeCount !== 'number') {
        throw new Error('DETAIL_COMMENT.NOT_MEET_DATA_TYPE_SPECIFICATION');
      }
    }
  }
  
  module.exports = DetailComment;