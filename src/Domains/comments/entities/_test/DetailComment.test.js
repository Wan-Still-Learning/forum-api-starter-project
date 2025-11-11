const DetailComment = require('../DetailComment');

describe('DetailComment entities', () => {
  it('should throw error when payload not contain needed property', () => {
    // Arrange
    const payload = {
      id: 'comment-123',
      username: 'dicoding',
      date: new Date(),
      content: 'sebuah komentar',
      is_delete: false,
      // likeCount is missing
    };

    // Action & Assert
    expect(() => new DetailComment(payload)).toThrowError('DETAIL_COMMENT.NOT_CONTAIN_NEEDED_PROPERTY');
  });

  it('should throw error when payload not meet data type specification', () => {
    // Arrange
    const payload = {
      id: 123, // should be string
      username: 'dicoding',
      date: new Date(),
      content: 'sebuah komentar',
      is_delete: false,
      likeCount: '0',
    };

    // Action & Assert
    expect(() => new DetailComment(payload)).toThrowError('DETAIL_COMMENT.NOT_MEET_DATA_TYPE_SPECIFICATION');
  });

  it('should create DetailComment entities correctly', () => {
    // Arrange
    const payload = {
      id: 'comment-123',
      username: 'dicoding',
      date: new Date(),
      content: 'sebuah komentar',
      is_delete: false,
      likeCount: 0,
    };

    // Action
    const detailComment = new DetailComment(payload);

    // Assert
    expect(detailComment).toBeInstanceOf(DetailComment);
    expect(detailComment.id).toEqual(payload.id);
    expect(detailComment.username).toEqual(payload.username);
    expect(detailComment.date).toEqual(payload.date);
    expect(detailComment.content).toEqual(payload.content);
    expect(detailComment.likeCount).toEqual(payload.likeCount);
    expect(detailComment.replies).toEqual([]);
  });

  it('should create DetailComment entities correctly when comment is deleted', () => {
    // Arrange
    const payload = {
      id: 'comment-123',
      username: 'dicoding',
      date: new Date(),
      content: 'sebuah komentar',
      is_delete: true,
      likeCount: 0,
    };

    // Action
    const detailComment = new DetailComment(payload);

    // Assert
    expect(detailComment).toBeInstanceOf(DetailComment);
    expect(detailComment.id).toEqual(payload.id);
    expect(detailComment.username).toEqual(payload.username);
    expect(detailComment.date).toEqual(payload.date);
    expect(detailComment.content).toEqual('**komentar telah dihapus**');
    expect(detailComment.likeCount).toEqual(payload.likeCount);
    expect(detailComment.replies).toEqual([]);
  });
});